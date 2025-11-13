import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text , NativeTextEvent } from 'react-native';
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

interface MessageParamsV1Data {
  name: string;
  value: string;
}

interface MessageParams {
  metamaskId: string;
  from: string;
  data: string | MessageParamsV1Data[];
  version: 'V1' | 'V3' | 'V4';
  origin?: string;
}

interface CurrentPageInformation {
  url: string;
  icon?: string;
}

interface TypedSignProps {
  navigation: any;
  onReject: () => void;
  onConfirm: () => void;
  messageParams: MessageParams;
  currentPageInformation: CurrentPageInformation;
  toggleExpandedMessage: () => void;
  showExpandedMessage: boolean;
  securityAlertResponse?: object;
  metrics: any;
  networkType?: string;
}

interface TypedSignState {
  truncateMessage: boolean;
}

class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  static contextType = ThemeContext;
  context!: React.ContextType<typeof ThemeContext>;

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

  onSignatureError = ({ error }: { error: Error }) => {
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
      typedSign[messageParams.version],
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

  updateShouldTruncateMessage = (e: { nativeEvent: NativeTextEvent }) => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = () => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderTypedMessageV3 = (obj: Record<string, any>): React.ReactNode => {
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
          {(messageParams.data as MessageParamsV1Data[]).map((obj, i) => (
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
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(messageParams.data as string);
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
        type={typedSign[messageParams.version]}
        fromAddress={from}
        testID={SigningBottomSheetSelectorsIDs.TYPED_REQUEST}
        networkType={networkType}
      >
        <View
          style={messageWrapperStyles}
          onLayout={truncateMessage ? null : this.updateShouldTruncateMessage}
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

const mapStateToProps = (state: any, ownProps: TypedSignProps) => {
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
