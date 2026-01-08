import React, { useCallback, useEffect, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from '../../../../../../util/confirmation/signatureUtils';
import { isExternalHardwareAccount } from '../../../../../../util/address';
import createExternalSignModelNav from '../../../../../../util/hardwareWallet/signatureUtils';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { RootState } from '../../../../../../reducers';
import { Theme } from '../../../../../../util/theme/models';
import { Hex } from '@metamask/utils';

interface TypedSignV1DataItem {
  name: string;
  value: string;
  type?: string;
}

interface TypedSignMessageParams {
  data: string | TypedSignV1DataItem[] | Record<string, unknown>;
  from: string;
  metamaskId: string;
  origin: string;
  version?: 'V1' | 'V3' | 'V4' | string;
  meta?: PageMeta;
}

interface TypedSignProps {
  onReject: () => void;
  onConfirm: () => void;
  messageParams: TypedSignMessageParams;
  currentPageInformation: PageMeta;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
  // Additional props that may be passed but not used directly
  navigation?: unknown;
}

interface Colors {
  text: {
    default: string;
  };
}

type MessageObject = Record<string, unknown>;

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

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
const TypedSign = ({
  onReject,
  onConfirm,
  messageParams,
  currentPageInformation,
  toggleExpandedMessage,
  showExpandedMessage,
}: TypedSignProps) => {
  const navigation = useNavigation();
  const { trackEvent, createEventBuilder } = useMetrics();
  const { colors } = useTheme() as Theme;
  const styles = createStyles(colors as Colors);
  const [truncateMessage, setTruncateMessage] = useState<boolean>(false);

  const signatureRequest = useSelector((state: RootState) =>
    selectSignatureRequestById(state, messageParams.metamaskId),
  );

  const { chainId } = signatureRequest ?? {};

  const networkType = useSelector((state: RootState) =>
    selectProviderTypeByChainId(state, chainId as Hex),
  );

  const securityAlertResponse = useSelector(
    (state: RootState) =>
      (state as RootState & { signatureRequest: { securityAlertResponse: SecurityAlertResponse } })
        .signatureRequest.securityAlertResponse,
  );

  const onSignatureError = useCallback(
    ({ error }: { error: Error }) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED)
            .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
            .build(),
        );
      }
      showWalletConnectNotification(messageParams, false, true);
    },
    [messageParams, trackEvent, createEventBuilder],
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

  const rejectSignature = useCallback(async () => {
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version as keyof typeof typedSign],
      securityAlertResponse,
      false,
    );
  }, [messageParams, onReject, securityAlertResponse]);

  const confirmSignature = useCallback(async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        typedSign[messageParams.version as keyof typeof typedSign],
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          typedSign[messageParams.version as keyof typeof typedSign],
        )),
      );
    }
  }, [messageParams, onConfirm, onReject, navigation, securityAlertResponse]);

  const updateShouldTruncateMessage = useCallback((e: LayoutChangeEvent) => {
    const shouldTruncate = shouldTruncateMessage(e);
    setTruncateMessage(shouldTruncate);
  }, []);

  const renderTypedMessageV3 = useCallback(
    (obj: MessageObject): ReactNode => {
      return Object.keys(obj).map((key) => {
        const value = obj[key];
        return (
          <View style={styles.message} key={key}>
            {value && typeof value === 'object' ? (
              <View>
                <Text style={[styles.messageText, styles.msgKey]}>
                  {escapeSpecialUnicode(key)}:
                </Text>
                <View>{renderTypedMessageV3(value as MessageObject)}</View>
              </View>
            ) : (
              <Text style={styles.messageText}>
                <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
                {escapeSpecialUnicode(`${value}`)}
              </Text>
            )}
          </View>
        );
      });
    },
    [styles],
  );

  const renderTypedMessage = useCallback((): ReactNode => {
    if (messageParams.version === 'V1') {
      const data = messageParams.data as TypedSignV1DataItem[];
      return (
        <View style={styles.message}>
          {data.map((obj, i) => (
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
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(
        messageParams.data as string,
      );
      return renderTypedMessageV3(sanitizedMessage as unknown as MessageObject);
    }
    return null;
  }, [messageParams, styles, renderTypedMessageV3]);

  const messageWrapperStyles = [];
  let domain;

  if (messageParams.version === 'V3') {
    domain = JSON.parse(messageParams.data as string).domain;
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
      onReject={rejectSignature}
      onConfirm={confirmSignature}
      toggleExpandedMessage={toggleExpandedMessage}
      currentPageInformation={currentPageInformation}
      truncateMessage={truncateMessage}
      type={typedSign[messageParams.version as keyof typeof typedSign]}
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
