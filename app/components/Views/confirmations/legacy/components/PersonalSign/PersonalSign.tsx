import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import {
  isExternalHardwareAccount,
  stripHexPrefix,
} from '../../../../../../util/address';
import { escapeSpecialUnicode } from '../../../../../../util/string';
import { useTheme } from '../../../../../../util/theme';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import createStyles from './styles';
import { PersonalSignProps } from './types';

import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import Logger from '../../../../../../util/Logger';
import createExternalSignModelNav from '../../../../../../util/hardwareWallet/signatureUtils';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { RootState } from '../../../../../../reducers';
import { Hex } from '@metamask/utils';
import {
  addSignatureErrorListener,
  removeSignatureErrorListener,
  getAnalyticsParams as getSignatureAnalyticsParams,
  handleSignatureAction,
} from '../../../../../../util/confirmation/signatureUtils';

/**
 * Converts a hexadecimal string to a utf8 string.
 * If the hexadecimal string is 32 bytes long, it is assumed to be a hash and returned as is.
 *
 * @param {string} hex - Hexadecimal string to convert
 * @returns {string} - The utf8 equivalent or the original hexadecimal string.
 */
function msgHexToText(hex: string): string {
  try {
    const stripped = stripHexPrefix(hex);
    const buff = Buffer.from(stripped, 'hex');
    return buff.length === 32 ? hex : buff.toString('utf8');
  } catch (e) {
    Logger.log(e);
    return hex;
  }
}

/**
 * Component that supports personal_sign
 */
const PersonalSign = ({
  onConfirm,
  onReject,
  messageParams,
  currentPageInformation,
  toggleExpandedMessage,
  showExpandedMessage,
}: PersonalSignProps) => {
  const navigation = useNavigation();
  const { trackEvent, createEventBuilder } = useMetrics();
  const [truncateMessage, setTruncateMessage] = useState<boolean>(false);

  const { securityAlertResponse } = useSelector(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reduxState: any) => reduxState.signatureRequest,
  );

  const signatureRequest = useSelector((state: RootState) =>
    selectSignatureRequestById(state, messageParams.metamaskId),
  );

  const { chainId } = signatureRequest ?? {};

  const networkType = useSelector((state: RootState) =>
    selectProviderTypeByChainId(state, chainId as Hex),
  );

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { colors }: any = useTheme();
  const styles = createStyles(colors);

  const onSignatureError = useCallback(
    ({ error }: { error: Error }) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED)
            .addProperties(
              getSignatureAnalyticsParams(
                { ...messageParams, currentPageInformation },
                'personal_sign',
                securityAlertResponse,
              ),
            )
            .build(),
        );
      }
    },
    [
      trackEvent,
      createEventBuilder,
      messageParams,
      currentPageInformation,
      securityAlertResponse,
    ],
  );

  useEffect(() => {
    addSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    return () => {
      removeSignatureErrorListener(messageParams.metamaskId, onSignatureError);
    };
  }, [messageParams.metamaskId, onSignatureError]);

  const rejectSignature = async () => {
    await handleSignatureAction(
      onReject,
      { ...messageParams, currentPageInformation },
      'personal_sign',
      securityAlertResponse,
      false,
    );
  };

  const confirmSignature = async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        { ...messageParams, currentPageInformation },
        'personal_sign',
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          'personal_sign',
        )),
      );
    }
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shouldTruncateMessage = (e: any) => {
    if (e.nativeEvent.lines.length > 5) {
      setTruncateMessage(true);
      return;
    }
    setTruncateMessage(false);
  };

  const renderMessageText = () => {
    const textChild = escapeSpecialUnicode(msgHexToText(messageParams.data))
      .split('\n')
      .map((line: string, i: number) => (
        <Text
          key={`txt_${i}`}
          style={[
            styles.messageText,
            !showExpandedMessage ? styles.textLeft : null,
          ]}
        >
          {line}
          {!showExpandedMessage && '\n'}
        </Text>
      ));
    let messageText;
    if (showExpandedMessage) {
      messageText = textChild;
    } else {
      messageText = truncateMessage ? (
        <Text
          style={styles.messageTextColor}
          numberOfLines={5}
          ellipsizeMode={'tail'}
        >
          {textChild}
        </Text>
      ) : (
        <Text
          style={styles.messageTextColor}
          onTextLayout={shouldTruncateMessage}
        >
          {textChild}
        </Text>
      );
    }
    return messageText;
  };

  const rootView = showExpandedMessage ? (
    <ExpandedMessage
      currentPageInformation={currentPageInformation}
      renderMessage={renderMessageText}
      toggleExpandedMessage={toggleExpandedMessage}
    />
  ) : (
    <SignatureRequest
      navigation={navigation}
      onReject={rejectSignature}
      onConfirm={confirmSignature}
      currentPageInformation={currentPageInformation}
      showExpandedMessage={showExpandedMessage}
      toggleExpandedMessage={toggleExpandedMessage}
      truncateMessage={truncateMessage}
      type="personal_sign"
      fromAddress={messageParams.from}
      origin={messageParams.origin}
      testID={SigningBottomSheetSelectorsIDs.PERSONAL_REQUEST}
      networkType={networkType}
    >
      <View style={styles.messageWrapper}>{renderMessageText()}</View>
    </SignatureRequest>
  );
  return rootView;
};

export default PersonalSign;
