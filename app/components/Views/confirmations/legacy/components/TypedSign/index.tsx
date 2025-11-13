import React, { useState, useEffect, useCallback } from 'react';
import { connect, useSelector } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../../../core/Analytics/MetricsEventBuilder';
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
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { MessageParams, PageMeta } from '../SignatureRequest/types';
import { RootState } from '../../../../../../reducers';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

const createStyles = (colors: { text: { default: string } }) =>
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

interface TypedSignProps {
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
  onReject: () => void;
  onConfirm: () => void;
  messageParams: MessageParams;
  currentPageInformation: PageMeta;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
  securityAlertResponse?: SecurityAlertResponse;
  metrics: {
    trackEvent: (event: unknown) => void;
  };
  networkType?: string;
}

interface TypedMessageV1Item {
  name: string;
  value: string;
}

interface TypedMessageData {
  [key: string]: string | TypedMessageData;
}

const TypedSign = ({
  navigation,
  onReject,
  onConfirm,
  messageParams,
  currentPageInformation,
  toggleExpandedMessage,
  showExpandedMessage,
  securityAlertResponse,
  metrics,
  networkType,
}: TypedSignProps) => {
  const [truncateMessage, setTruncateMessage] = useState<boolean>(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    const { metamaskId } = messageParams;

    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.SIGNATURE_REQUESTED,
      )
        .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
        .build(),
    );

    const onSignatureError = ({ error }: { error: Error }) => {
      if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
        metrics.trackEvent(
          MetricsEventBuilder.createEventBuilder(
            MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
          )
            .addProperties(getAnalyticsParams())
            .build(),
        );
      }
      showWalletConnectNotification(messageParams, false, true);
    };

    addSignatureErrorListener(metamaskId, onSignatureError);

    return () => {
      removeSignatureErrorListener(metamaskId, onSignatureError);
    };
  }, [messageParams, metrics]);

  const rejectSignature = useCallback(async () => {
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version || 'V1'],
      securityAlertResponse,
      false,
    );
  }, [onReject, messageParams, securityAlertResponse]);

  const confirmSignature = useCallback(async () => {
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        typedSign[messageParams.version || 'V1'],
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          typedSign[messageParams.version || 'V1'],
        )),
      );
    }
  }, [
    onConfirm,
    onReject,
    messageParams,
    securityAlertResponse,
    navigation,
  ]);

  const updateShouldTruncateMessage = useCallback(
    (e: { nativeEvent: { lines: unknown[] } }) => {
      const truncate = shouldTruncateMessage(e);
      setTruncateMessage(truncate);
    },
    [],
  );

  const renderTypedMessageV3 = useCallback(
    (obj: TypedMessageData): JSX.Element[] =>
      Object.keys(obj).map((key) => (
        <View style={styles.message} key={key}>
          {obj[key] && typeof obj[key] === 'object' ? (
            <View>
              <Text style={[styles.messageText, styles.msgKey]}>
                {escapeSpecialUnicode(key)}:
              </Text>
              <View>
                {renderTypedMessageV3(obj[key] as TypedMessageData)}
              </View>
            </View>
          ) : (
            <Text style={styles.messageText}>
              <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
              {escapeSpecialUnicode(`${obj[key]}`)}
            </Text>
          )}
        </View>
      )),
    [styles],
  );

  const renderTypedMessage = useCallback(() => {
    if (messageParams.version === 'V1') {
      const data = messageParams.data as unknown as TypedMessageV1Item[];
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
        messageParams.data,
      );
      return renderTypedMessageV3(sanitizedMessage);
    }
    return null;
  }, [messageParams, styles, renderTypedMessageV3]);

  const messageWrapperStyles = [];
  let domain;

  if (messageParams.version === 'V3') {
    domain = JSON.parse(messageParams.data).domain;
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
      type={typedSign[messageParams.version || 'V1']}
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

const mapStateToProps = (
  state: RootState,
  ownProps: { messageParams: MessageParams },
) => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(state, signatureRequest?.chainId),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

export default connect(mapStateToProps)(withMetricsAwareness(TypedSign));
