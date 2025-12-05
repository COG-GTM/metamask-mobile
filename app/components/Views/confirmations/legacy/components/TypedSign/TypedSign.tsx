import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
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
import { RootState } from '../../../../../../reducers';
import { Hex } from '@metamask/utils';
import createStyles from './styles';
import { PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

interface TypedDataV1Item {
  name: string;
  value: string;
}

export interface TypedMessageParams {
  data: string | TypedDataV1Item[];
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
  version: 'V1' | 'V3' | 'V4';
  securityAlertResponse?: SecurityAlertResponse;
}

export interface TypedSignProps {
  onReject: () => Promise<void> | void;
  onConfirm: () => Promise<void> | void;
  messageParams: TypedMessageParams;
  currentPageInformation: PageMeta;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
}

interface SignatureErrorEvent {
  error: Error;
}

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

  const signatureRequest = useSelector((state: RootState) =>
    selectSignatureRequestById(state, messageParams.metamaskId),
  );

  const { chainId } = signatureRequest ?? {};

  const networkType = useSelector((state: RootState) =>
    selectProviderTypeByChainId(state, chainId as Hex),
  );

  const { securityAlertResponse } = useSelector(
    (reduxState: RootState) => reduxState.signatureRequest,
  );

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getAnalyticsParamsCallback = useCallback(() => {
    return getAnalyticsParams(messageParams, 'typed_sign', securityAlertResponse);
  }, [messageParams, securityAlertResponse]);

  useEffect(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(getAnalyticsParamsCallback())
        .build(),
    );

    const onSignatureError = ({ error }: SignatureErrorEvent) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED)
            .addProperties(getAnalyticsParamsCallback())
            .build(),
        );
      }
      showWalletConnectNotification(messageParams, false, true);
    };

    addSignatureErrorListener(messageParams.metamaskId, onSignatureError);

    return () => {
      removeSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    };
  }, [
    messageParams,
    trackEvent,
    createEventBuilder,
    getAnalyticsParamsCallback,
  ]);

  const rejectSignature = async () => {
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version],
      securityAlertResponse,
      false,
    );
  };

  const confirmSignature = async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        typedSign[messageParams.version],
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          typedSign[messageParams.version],
        )),
      );
    }
  };

  const updateShouldTruncateMessage = (e: LayoutChangeEvent) => {
    const shouldTruncate = shouldTruncateMessage(e);
    setTruncateMessage(shouldTruncate);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTypedMessageV3 = (obj: any): React.ReactNode => {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>{renderTypedMessageV3(obj[key])}</View>
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
      const data = messageParams.data as TypedDataV1Item[];
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
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(
        messageParams.data as string,
      );
      return renderTypedMessageV3(sanitizedMessage);
    }
    return null;
  };

  const messageWrapperStyles: StyleProp<ViewStyle>[] = [];
  let domain: unknown;

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
      navigation={navigation}
      onReject={rejectSignature}
      onConfirm={confirmSignature}
      toggleExpandedMessage={toggleExpandedMessage}
      domain={domain}
      currentPageInformation={currentPageInformation}
      truncateMessage={truncateMessage}
      type={typedSign[messageParams.version]}
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
