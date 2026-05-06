/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequestOrig from '../SignatureRequest';
import ExpandedMessageOrig from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';

const SignatureRequest: any = SignatureRequestOrig;
const ExpandedMessage: any = ExpandedMessageOrig;
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

const createStyles = (colors: any) =>
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

interface MessageParams {
  metamaskId: string;
  data: any;
  version?: string;
  from?: string;
  [key: string]: any;
}

interface Props {
  navigation?: any;
  onReject?: () => void;
  onConfirm?: () => void;
  messageParams: MessageParams;
  currentPageInformation?: any;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
  securityAlertResponse?: any;
  metrics?: any;
  networkType?: string;
}

interface State {
  truncateMessage: boolean;
}

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
class TypedSign extends PureComponent<Props, State> {
  declare context: any;

  state: State = {
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

  onSignatureError = ({ error }: { error: any }) => {
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
      onReject as any,
      messageParams,
      (typedSign as any)[messageParams.version as string],
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
    if (!isExternalHardwareAccount(messageParams.from as string)) {
      await handleSignatureAction(
        onConfirm as any,
        messageParams,
        (typedSign as any)[messageParams.version as string],
        securityAlertResponse,
        true,
      );
    } else {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject as any,
          onConfirm as any,
          messageParams,
          (typedSign as any)[messageParams.version as string],
        )),
      );
    }
  };

  updateShouldTruncateMessage = (e: any) => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = () => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

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
          {messageParams.data.map((obj: any, i: number) => (
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
        type={(typedSign as any)[messageParams.version as string]}
        fromAddress={from}
        testID={SigningBottomSheetSelectorsIDs.TYPED_REQUEST}
        networkType={networkType}
      >
        <View
          style={messageWrapperStyles}
          onLayout={truncateMessage ? undefined : this.updateShouldTruncateMessage}
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

(TypedSign as any).contextType = ThemeContext;

const mapStateToProps = (state: any, ownProps: any) => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(state, signatureRequest?.chainId as any),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

export default connect(mapStateToProps)(withMetricsAwareness(TypedSign as any));
