import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
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
import { RootState } from '../../../../../../reducers';

interface Styles {
  messageText: TextStyle;
  message: ViewStyle;
  truncatedMessageWrapper: ViewStyle;
  iosHeight: ViewStyle;
  androidHeight: ViewStyle;
  msgKey: TextStyle;
}

interface Colors {
  text: {
    default: string;
  };
}

const createStyles = (colors: Colors): Styles =>
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

interface V1DataItem {
  name: string;
  value: string;
}

interface MessageParams {
  metamaskId: string;
  version: 'V1' | 'V3' | 'V4';
  data: V1DataItem[] | string;
  from: string;
}

interface CurrentPageInformation {
  url: string;
  title?: string;
  icon?: string;
}

interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: string[];
}

interface Metrics {
  trackEvent: (event: unknown) => void;
}

interface SignatureError {
  error?: {
    message: string;
  };
}

interface TypedSignProps {
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
  onReject: () => Promise<void>;
  onConfirm: () => Promise<void>;
  messageParams: MessageParams;
  currentPageInformation: CurrentPageInformation;
  toggleExpandedMessage: () => void;
  showExpandedMessage: boolean;
  securityAlertResponse: SecurityAlertResponse;
  metrics: Metrics;
  networkType: string;
}

interface TypedSignState {
  truncateMessage: boolean;
}

interface TypedMessageObject {
  [key: string]: TypedMessageObject | string | number | boolean | null;
}

class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: TypedSignState = {
    truncateMessage: false,
  };

  componentDidMount = (): void => {
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

  componentWillUnmount = (): void => {
    const {
      messageParams: { metamaskId },
    } = this.props;
    removeSignatureErrorListener(metamaskId, this.onSignatureError);
  };

  onSignatureError = ({ error }: SignatureError): void => {
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

  rejectSignature = async (): Promise<void> => {
    const { messageParams, onReject, securityAlertResponse } = this.props;
    await handleSignatureAction(
      onReject,
      messageParams,
      typedSign[messageParams.version],
      securityAlertResponse,
      false,
    );
  };

  confirmSignature = async (): Promise<void> => {
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

  updateShouldTruncateMessage = (e: LayoutChangeEvent): void => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = (): Styles => {
    const colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderTypedMessageV3 = (obj: TypedMessageObject): React.ReactElement[] => {
    const styles = this.getStyles();
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>
              {this.renderTypedMessageV3(obj[key] as TypedMessageObject)}
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
  };

  renderTypedMessage = (): React.ReactElement | undefined => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {(messageParams.data as V1DataItem[]).map((obj, i) => (
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
      return (
        <View style={styles.message}>
          {this.renderTypedMessageV3(sanitizedMessage as TypedMessageObject)}
        </View>
      );
    }
    return undefined;
  };

  render(): React.ReactElement {
    const {
      messageParams,
      currentPageInformation,
      showExpandedMessage,
      toggleExpandedMessage,
      messageParams: { from },
      networkType,
    } = this.props;
    const { truncateMessage } = this.state;
    const messageWrapperStyles: ViewStyle[] = [];
    let domain: unknown;
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
          onLayout={truncateMessage ? undefined : this.updateShouldTruncateMessage}
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

interface OwnProps {
  messageParams: MessageParams;
}

const mapStateToProps = (
  state: RootState,
  ownProps: OwnProps,
): { networkType: string; securityAlertResponse: SecurityAlertResponse } => {
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
