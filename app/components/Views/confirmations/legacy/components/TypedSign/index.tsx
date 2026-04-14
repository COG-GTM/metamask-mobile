import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { LayoutChangeEvent, StyleSheet, View, Text, ViewStyle } from 'react-native';
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
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { RootState } from '../../../../../../reducers';
import { Colors } from '../../../../../../util/theme/models';
import { MessageParams, PageMeta } from '../SignatureRequest/types';
import { IUseMetricsHook } from '../../../../../../components/hooks/useMetrics/useMetrics.types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

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
 * Props passed by the parent component
 */
interface OwnProps {
  /**
   * react-navigation object used for switching between screens
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject?: () => void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm?: () => void;
  /**
   * Typed message to be displayed to the user
   */
  messageParams: MessageParams;
  /**
   * Object containing current page title and url
   */
  currentPageInformation: PageMeta;
  /**
   * Hides or shows the expanded signing message
   */
  toggleExpandedMessage?: () => void;
  /**
   * Indicated whether or not the expanded message is shown
   */
  showExpandedMessage?: boolean;
}

/**
 * Props from mapStateToProps
 */
interface StateProps {
  /**
   * String representing the associated network
   */
  networkType?: string;
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
}

/**
 * Props injected by withMetricsAwareness HOC
 */
interface MetricsProps {
  metrics: IUseMetricsHook;
}

type Props = OwnProps & StateProps & MetricsProps;

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
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
}: Props) => {
  const [truncateMessage, setTruncateMessage] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const onSignatureError = useCallback(
    ({ error }: { error: Error }) => {
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
    },
    [metrics, messageParams],
  );

  useEffect(() => {
    const { metamaskId } = messageParams;

    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.SIGNATURE_REQUESTED,
      )
        .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
        .build(),
    );
    addSignatureErrorListener(metamaskId, onSignatureError);

    return () => {
      removeSignatureErrorListener(metamaskId, onSignatureError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rejectSignature = useCallback(async () => {
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version as keyof typeof typedSign],
      securityAlertResponse,
      false,
    );
  }, [onReject, messageParams, securityAlertResponse]);

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
          onReject as () => void,
          onConfirm as () => void,
          messageParams,
          typedSign[messageParams.version as keyof typeof typedSign],
        )),
      );
    }
  }, [onConfirm, onReject, messageParams, navigation, securityAlertResponse]);

  const updateShouldTruncateMessage = useCallback(
    (e: LayoutChangeEvent) => {
      const result = shouldTruncateMessage(e);
      setTruncateMessage(result);
    },
    [],
  );

  const renderTypedMessageV3 = (
    obj: Record<string, unknown>,
  ): React.ReactNode =>
    Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>
              {renderTypedMessageV3(obj[key] as Record<string, unknown>)}
            </View>
          </View>
        ) : (
          <Text style={styles.messageText}>
            <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
            {escapeSpecialUnicode(`${obj[key]}`)}
          </Text>
        )}
      </View>
    ));

  const renderTypedMessage = (): React.ReactNode => {
    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {(
            messageParams.data as unknown as {
              name: string;
              value: string;
            }[]
          ).map((obj, i) => (
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
      return renderTypedMessageV3(sanitizedMessage as unknown as Record<string, unknown>);
    }
  };

  const messageWrapperStyles: ViewStyle[] = [];
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

const mapStateToProps = (
  state: RootState,
  ownProps: OwnProps,
): StateProps => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(state, signatureRequest?.chainId as `0x${string}`),

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    securityAlertResponse: (state as any).signatureRequest
      .securityAlertResponse,
  };
};

export default connect(mapStateToProps)(
  withMetricsAwareness(
    TypedSign as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
