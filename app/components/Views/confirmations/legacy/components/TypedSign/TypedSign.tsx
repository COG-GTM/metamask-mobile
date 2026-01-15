import React, { useCallback, useEffect, useState } from 'react';
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
  MessageParams,
} from '../../../../../../util/confirmation/signatureUtils';
import { isExternalHardwareAccount } from '../../../../../../util/address';
import createExternalSignModelNav from '../../../../../../util/hardwareWallet/signatureUtils';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { RootState } from '../../../../../../reducers';
import { Hex } from '@metamask/utils';
import { TypedSignProps, TypedDataV1 } from './types';

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

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3/v4
 */
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reduxState: any) => reduxState.signatureRequest,
  );

  const signatureRequest = useSelector((state: RootState) =>
    selectSignatureRequestById(state, messageParams.metamaskId),
  );

  const networkType = useSelector((state: RootState) =>
    selectProviderTypeByChainId(state, signatureRequest?.chainId as Hex),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { colors }: any = useTheme();
  const styles = createStyles(colors);

  const signType = typedSign[messageParams.version as keyof typeof typedSign];

  const onSignatureError = useCallback(
    ({ error }: { error: Error }) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED)
            .addProperties(
              getAnalyticsParams(
                { ...messageParams, currentPageInformation } as MessageParams,
                signType,
                securityAlertResponse,
              ),
            )
            .build(),
        );
      }
      showWalletConnectNotification(messageParams as MessageParams, false, true);
    },
    [
      trackEvent,
      createEventBuilder,
      messageParams,
      currentPageInformation,
      securityAlertResponse,
      signType,
    ],
  );

  useEffect(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(
          getAnalyticsParams(
            { ...messageParams, currentPageInformation } as MessageParams,
            signType,
            securityAlertResponse,
          ),
        )
        .build(),
    );
    addSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    return () => {
      removeSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageParams.metamaskId]);

  const rejectSignature = async () => {
    await handleSignatureAction(
      onReject,
      { ...messageParams, currentPageInformation } as MessageParams,
      signType,
      securityAlertResponse,
      false,
    );
  };

  const confirmSignature = async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        { ...messageParams, currentPageInformation } as MessageParams,
        signType,
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams as any,
          signType,
        )) as [never],
      );
    }
  };

  const updateShouldTruncateMessage = (e: LayoutChangeEvent) => {
    const shouldTruncate = shouldTruncateMessage(e);
    setTruncateMessage(shouldTruncate);
  };

  const renderTypedMessageV3 = (obj: Record<string, unknown>): JSX.Element[] => {
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

  const renderTypedMessage = (): JSX.Element | JSX.Element[] | undefined => {
    if (messageParams.version === 'V1') {
      const data = messageParams.data as TypedDataV1[];
      return (
        <View style={styles.message}>
          {data.map((obj: TypedDataV1, i: number) => (
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
      return renderTypedMessageV3(sanitizedMessage as unknown as Record<string, unknown>);
    }
    return undefined;
  };

  const messageWrapperStyles: object[] = [];
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
      type={signType}
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
