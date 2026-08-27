/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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
class TypedSign extends PureComponent {

  state = {
    truncateMessage: false,
  };

  componentDidMount = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams: { metamaskId },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      metrics,
    } = this.props;

    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.SIGNATURE_REQUESTED,
      )
        // @ts-expect-error -- legacy JavaScript UI type boundary
        .addProperties(getAnalyticsParams(messageParams, 'typed_sign'))
        .build(),
    );
    addSignatureErrorListener(metamaskId, this.onSignatureError);
  };

  componentWillUnmount = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams: { metamaskId },
    } = this.props;
    removeSignatureErrorListener(metamaskId, this.onSignatureError);
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onSignatureError = ({ error }) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { metrics } = this.props;
    if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
      metrics.trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
        )
          // @ts-expect-error -- legacy JavaScript UI type boundary
          .addProperties(getAnalyticsParams())
          .build(),
      );
    }
    // @ts-expect-error -- legacy JavaScript UI type boundary
    showWalletConnectNotification(this.props.messageParams, false, true);
  };

  rejectSignature = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { messageParams, onReject, securityAlertResponse } = this.props;
    await handleSignatureAction(
      onReject,
      messageParams,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      typedSign[messageParams.version],
      securityAlertResponse,
      false,
    );
  };

  confirmSignature = async () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      onConfirm,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      onReject,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      securityAlertResponse,
    } = this.props;
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
          // @ts-expect-error -- legacy JavaScript UI type boundary
          typedSign[messageParams.version],
        )),
      );
    }
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateShouldTruncateMessage = (e) => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  renderTypedMessageV3 = (obj) => {
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          {messageParams.data.map((obj, i) => (
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
      return this.renderTypedMessageV3(sanitizedMessage);
    }
  };

  render() {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      currentPageInformation,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      showExpandedMessage,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      toggleExpandedMessage,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      messageParams: { from },
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        currentPageInformation={currentPageInformation}
        renderMessage={this.renderTypedMessage}
        toggleExpandedMessage={toggleExpandedMessage}
      />
    ) : (
      <SignatureRequest
        // @ts-expect-error -- legacy JavaScript UI type boundary
        navigation={this.props.navigation}
        onReject={this.rejectSignature}
        onConfirm={this.confirmSignature}
        toggleExpandedMessage={toggleExpandedMessage}
        domain={domain}
        currentPageInformation={currentPageInformation}
        truncateMessage={truncateMessage}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        type={typedSign[messageParams.version]}
        fromAddress={from}
        testID={SigningBottomSheetSelectorsIDs.TYPED_REQUEST}
        networkType={networkType}
      >
        <View
          style={messageWrapperStyles}
          // @ts-expect-error -- legacy JavaScript UI type boundary
          onLayout={truncateMessage ? null : this.updateShouldTruncateMessage}
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

TypedSign.contextType = ThemeContext;

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state, ownProps) => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    networkType: selectProviderTypeByChainId(state, signatureRequest?.chainId),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

// @ts-expect-error -- legacy JavaScript UI type boundary
export default connect(mapStateToProps)(withMetricsAwareness(TypedSign));

interface TypedSignProps {
  currentPageInformation?: Record<string, any>;
  messageParams?: Record<string, any>;
  metrics?: Record<string, any>;
  navigation?: Record<string, any>;
  networkType?: string;
  onConfirm?: (...args: any[]) => any;
  onReject?: (...args: any[]) => any;
  securityAlertResponse?: Record<string, any>;
  showExpandedMessage?: boolean;
  toggleExpandedMessage?: (...args: any[]) => any;
}
