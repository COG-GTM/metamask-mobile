import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import { Hex } from '@metamask/utils';
import { RootState } from '../../../../../../reducers';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../../../core/Analytics/MetricsEventBuilder';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
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
import { Colors, Theme } from '../../../../../../util/theme/models';

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

interface TypedSignState {
  truncateMessage: boolean;
}

interface TypedSignProps {
  /**
   * react-navigation object used for switching between screens
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  /**
   * Callback triggered when this message signature is rejected
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReject: (...args: any[]) => any;
  /**
   * Callback triggered when this message signature is approved
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm: (...args: any[]) => any;
  /**
   * Typed message to be displayed to the user
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageParams?: any;
  /**
   * Object containing current page title and url
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPageInformation?: any;
  /**
   * Hides or shows the expanded signing message
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleExpandedMessage?: (...args: any[]) => any;
  /**
   * Indicated whether or not the expanded message is shown
   */
  showExpandedMessage?: boolean;
  /**
   * Security alert response object
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse: any;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any;
  /**
   * String representing the associated network
   */
  networkType: string;
}

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  state: TypedSignState = {
    truncateMessage: false,
  };

  componentDidMount = () => {
    const {
      messageParams: { metamaskId },
      messageParams,
      metrics,
    } = this.props;

    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.SIGNATURE_REQUESTED,
      )
        .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
        .build(),
    );
    addSignatureErrorListener(metamaskId, this.onSignatureError);
  };

  componentWillUnmount = () => {
    const {
      messageParams: { metamaskId },
    } = this.props;
    removeSignatureErrorListener(metamaskId, this.onSignatureError);
  };

  onSignatureError = ({ error }: { error?: Error }) => {
    const { metrics } = this.props;
    if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
      metrics.trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
        )
          .addProperties(getAnalyticsParams())
          .build(),
      );
    }
    showWalletConnectNotification(this.props.messageParams, false, true);
  };

  rejectSignature = async () => {
    const { messageParams, onReject, securityAlertResponse } = this.props;
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version as keyof typeof typedSign],
      securityAlertResponse,
      false,
    );
  };

  confirmSignature = async () => {
    const {
      messageParams,
      onConfirm,
      onReject,
      navigation,
      securityAlertResponse,
    } = this.props;
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
  };

  updateShouldTruncateMessage = (e: LayoutChangeEvent) => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    return createStyles(colors);
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderTypedMessageV3 = (obj: any) => {
    const styles = this.getStyles();
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>{this.renderTypedMessageV3(obj[key])}</View>
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

  renderTypedMessage = () => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {messageParams.data.map(
            (obj: { name: string; value: string }, i: number) => (
              <View key={`${obj.name}_${i}`}>
                <Text style={[styles.messageText, styles.msgKey]}>
                  {escapeSpecialUnicode(obj.name)}:
                </Text>
                <Text style={styles.messageText} key={obj.name}>
                  {escapeSpecialUnicode(` ${obj.value}`)}
                </Text>
              </View>
            ),
          )}
        </View>
      );
    }
    if (messageParams.version === 'V3' || messageParams.version === 'V4') {
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(
        messageParams.data,
      );
      return this.renderTypedMessageV3(sanitizedMessage);
    }
  };

  render() {
    const {
      messageParams,
      currentPageInformation,
      showExpandedMessage,
      toggleExpandedMessage,
      messageParams: { from },
      networkType,
    } = this.props;
    const { truncateMessage } = this.state;
    const messageWrapperStyles = [];
    let domain;
    const styles = this.getStyles();

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
        renderMessage={this.renderTypedMessage}
        toggleExpandedMessage={toggleExpandedMessage}
      />
    ) : (
      <SignatureRequest
        navigation={this.props.navigation}
        onReject={this.rejectSignature}
        onConfirm={this.confirmSignature}
        toggleExpandedMessage={toggleExpandedMessage}
        domain={domain}
        currentPageInformation={currentPageInformation}
        truncateMessage={truncateMessage}
        type={typedSign[messageParams.version as keyof typeof typedSign]}
        fromAddress={from}
        testID={SigningBottomSheetSelectorsIDs.TYPED_REQUEST}
        networkType={networkType}
      >
        <View
          style={messageWrapperStyles}
          onLayout={
            truncateMessage ? undefined : this.updateShouldTruncateMessage
          }
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

TypedSign.contextType = ThemeContext;

const mapStateToProps = (
  state: RootState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ownProps: { messageParams: { metamaskId: string; [key: string]: any } },
) => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(
      state,
      signatureRequest?.chainId as Hex,
    ),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

export default connect(mapStateToProps)(
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withMetricsAwareness(TypedSign as any),
);
