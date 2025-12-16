import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import { Hex } from '@metamask/utils';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { useTheme } from '../../../../../../util/theme';
import { escapeSpecialUnicode } from '../../../../../../util/string';
import { parseAndSanitizeSignTypedData } from '../../../../../../components/Views/confirmations/utils/signature';
import {
  addSignatureErrorListener,
  getAnalyticsParams,
  handleSignatureAction,
  removeSignatureErrorListener,
  shouldTruncateMessage,
  showWalletConnectNotification,
  typedSign,
  SecurityAlertResponse,
} from '../../../../../../util/confirmation/signatureUtils';
import { isExternalHardwareAccount } from '../../../../../../util/address';
import createExternalSignModelNav from '../../../../../../util/hardwareWallet/signatureUtils';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { RootState } from '../../../../../../reducers';
import { PageMeta, MessageParams } from '../SignatureRequest/types';

export interface TypedSignProps {
  onReject: () => Promise<void> | void;
  onConfirm: () => Promise<void> | void;
  messageParams: MessageParams;
  currentPageInformation: PageMeta;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
}

interface TypedDataV1Item {
  name: string;
  value: string;
}

interface Colors {
  text: {
    default: string;
  };
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    messageText: {
      color: colors.text.default,
      ...fontStyles.normal,
      fontFamily: Device.isIos() ? 'Courier' : 'Roboto',
    },
    message: {
      marginLeft: 10,
    },
    truncatedMessageWrapper: {
      marginBottom: 4,
      overflow: 'hidden',
    },
    iosHeight: {
      height: 70,
    },
    androidHeight: {
      height: 97,
    },
    msgKey: {
      ...fontStyles.bold,
    },
  });

const TypedSign = ({
  onConfirm,
  onReject,
  messageParams,
  currentPageInformation,
  toggleExpandedMessage,
  showExpandedMessage,
}: TypedSignProps) => {
  const navigation = useNavigation();
  const { trackEvent, createEventBuilder } = useMetrics();
  const [truncateMessage, setTruncateMessage] = useState<boolean>(false);

  const { securityAlertResponse } = useSelector(
    (reduxState: RootState & { signatureRequest: { securityAlertResponse?: SecurityAlertResponse } }) =>
      reduxState.signatureRequest,
  );

  const signatureRequest = useSelector((state: RootState) =>
    selectSignatureRequestById(state, messageParams.metamaskId),
  );

  const { chainId } = signatureRequest ?? {};

  const networkType = useSelector((state: RootState) =>
    selectProviderTypeByChainId(state, chainId as Hex),
  );

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const signatureType = messageParams.version ? typedSign[messageParams.version] : 'typed_sign';

  const getAnalyticsParamsCallback = useCallback(
    () => getAnalyticsParams(messageParams, signatureType, securityAlertResponse),
    [messageParams, signatureType, securityAlertResponse],
  );

  const onSignatureError = useCallback(
    ({ error }: { error: Error }) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED)
            .addProperties(getAnalyticsParamsCallback())
            .build(),
        );
      }
      showWalletConnectNotification(messageParams, false, true);
    },
    [messageParams, trackEvent, createEventBuilder, getAnalyticsParamsCallback],
  );

  useEffect(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
        .build(),
    );
    addSignatureErrorListener(messageParams.metamaskId, onSignatureError);

    return () => {
      removeSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    };
  }, [messageParams, trackEvent, createEventBuilder, onSignatureError]);

  const rejectSignature = async () => {
    await handleSignatureAction(
      onReject,
      messageParams,
      signatureType,
      securityAlertResponse,
      false,
    );
  };

  const confirmSignature = async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        signatureType,
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          signatureType,
        )),
      );
    }
  };

  const updateShouldTruncateMessage = (e: LayoutChangeEvent) => {
    const shouldTruncate = shouldTruncateMessage(e);
    setTruncateMessage(shouldTruncate);
  };

  const renderTypedMessageV3 = (obj: Record<string, unknown>): React.ReactNode => {
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>{renderTypedMessageV3(obj[key] as Record<string, unknown>)}</View>
          </View>
        ) : (
          <Text style={styles.messageText}>
            <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
            {escapeSpecialUnicode(`${obj[key]}`)}
          </Text>
        )}
      </View>
    ));
  };

  const renderTypedMessage = (): React.ReactNode => {
    if (messageParams.version === 'V1') {
      const data = messageParams.data as unknown as TypedDataV1Item[];
      return (
        <View style={styles.message}>
          {data.map((obj: TypedDataV1Item, i: number) => (
            <View key={`${obj.name}_${i}`}>
              <Text style={[styles.messageText, styles.msgKey]}>
                {escapeSpecialUnicode(obj.name)}:
              </Text>
              <Text style={styles.messageText} key={obj.name}>
                {escapeSpecialUnicode(` ${obj.value}`)}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    if (messageParams.version === 'V3' || messageParams.version === 'V4') {
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(messageParams.data);
      if (sanitizedMessage && typeof sanitizedMessage === 'object') {
        return renderTypedMessageV3(sanitizedMessage as unknown as Record<string, unknown>);
      }
    }
    return null;
  };

  const messageWrapperStyles: ViewStyle[] = [];
  let domain: Record<string, unknown> | undefined;

  if (messageParams.version === 'V3' || messageParams.version === 'V4') {
    try {
      domain = JSON.parse(messageParams.data).domain;
    } catch {
      domain = undefined;
    }
  }

  if (truncateMessage) {
    messageWrapperStyles.push(styles.truncatedMessageWrapper);
    if (Device.isIos()) {
      messageWrapperStyles.push(styles.iosHeight);
    } else {
      messageWrapperStyles.push(styles.androidHeight);
    }
  }

  const rootView = showExpandedMessage ? (
    <ExpandedMessage
      currentPageInformation={currentPageInformation}
      renderMessage={renderTypedMessage}
      toggleExpandedMessage={toggleExpandedMessage}
    />
  ) : (
    <SignatureRequest
      navigation={navigation}
      onReject={rejectSignature}
      onConfirm={confirmSignature}
      toggleExpandedMessage={toggleExpandedMessage}
      domain={domain}
      currentPageInformation={currentPageInformation}
      truncateMessage={truncateMessage}
      type={signatureType}
      fromAddress={messageParams.from}
      testID={SigningBottomSheetSelectorsIDs.TYPED_REQUEST}
      networkType={networkType}
    >
      <View
        style={messageWrapperStyles}
        onLayout={truncateMessage ? undefined : updateShouldTruncateMessage}
      >
        {renderTypedMessage()}
      </View>
    </SignatureRequest>
  );

  return rootView;
};

export default TypedSign;
