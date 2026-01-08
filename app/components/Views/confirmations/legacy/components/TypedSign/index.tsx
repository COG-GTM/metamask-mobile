import React, { PureComponent, ReactNode } from 'react';
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
import { SignatureRequest } from '../SignatureRequest';
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
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { IUseMetricsHook } from '../../../../../hooks/useMetrics/useMetrics.types';
import { PageMeta } from '../SignatureRequest/types';
import { Theme } from '../../../../../../util/theme/models';

interface TypedSignStyles {
  messageText: TextStyle;
  message: ViewStyle;
  truncatedMessageWrapper: ViewStyle;
  iosHeight: ViewStyle;
  androidHeight: ViewStyle;
  msgKey: TextStyle;
}

interface ThemeColors {
  text: {
    default: string;
  };
}

const createStyles = (colors: ThemeColors): TypedSignStyles =>
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
 * V1 typed data item structure
 */
interface TypedDataV1Item {
  name: string;
  value: string;
}

/**
 * Navigation interface for TypedSign component
 */
interface TypedSignNavigation {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: (...args: any[]) => void;
}

/**
 * Message params for typed sign
 */
interface TypedSignMessageParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  from: string;
  metamaskId: string;
  origin?: string;
  version?: string;
  [key: string]: unknown;
}

/**
 * Props for the TypedSign component
 */
interface TypedSignProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation?: TypedSignNavigation;
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject?: () => Promise<void> | void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm?: () => Promise<void> | void;
  /**
   * Typed message to be displayed to the user
   */
  messageParams: TypedSignMessageParams;
  /**
   * Object containing current page title and url
   */
  currentPageInformation?: PageMeta;
  /**
   * Hides or shows the expanded signing message
   */
  toggleExpandedMessage?: () => void;
  /**
   * Indicated whether or not the expanded message is shown
   */
  showExpandedMessage?: boolean;
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics?: IUseMetricsHook;
  /**
   * String representing the associated network
   */
  networkType?: string;
}

/**
 * State for the TypedSign component
 */
interface TypedSignState {
  truncateMessage: boolean;
}

/**
 * Signature error event
 */
interface SignatureErrorEvent {
  error?: Error;
}

/**
 * Typed message object for V3/V4
 */
type TypedMessageObject = Record<string, unknown>;

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  declare context: Theme;

  state: TypedSignState = {
    truncateMessage: false,
  };

  componentDidMount = (): void => {
    const {
      messageParams: { metamaskId },
      messageParams,
      metrics,
    } = this.props;

    metrics?.trackEvent(
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

  onSignatureError = ({ error }: SignatureErrorEvent): void => {
    const { metrics } = this.props;
    if (error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
      metrics?.trackEvent(
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
      typedSign[messageParams.version as keyof typeof typedSign],
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
        typedSign[messageParams.version as keyof typeof typedSign],
        securityAlertResponse,
        true,
      );
    } else {
      const navArgs = await createExternalSignModelNav(
        onReject ?? (() => {}),
        onConfirm ?? (() => {}),
        messageParams,
        typedSign[messageParams.version as keyof typeof typedSign],
      );
      navigation?.navigate(navArgs[0], navArgs[1]);
    }
  };

  updateShouldTruncateMessage = (e: LayoutChangeEvent): void => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = (): TypedSignStyles => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderTypedMessageV3 = (obj: TypedMessageObject): ReactNode => {
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

  renderTypedMessage = (): ReactNode => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      const dataArray = messageParams.data as TypedDataV1Item[];
      return (
        <View style={styles.message}>
          {dataArray.map((obj: TypedDataV1Item, i: number) => (
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
      return this.renderTypedMessageV3(sanitizedMessage as unknown as TypedMessageObject);
    }
    return null;
  };

  render(): ReactNode {
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

    const defaultPageInfo = { title: '', url: '' };
    const pageInfo = currentPageInformation ?? defaultPageInfo;

    const rootView = showExpandedMessage ? (
      <ExpandedMessage
        currentPageInformation={pageInfo}
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
        currentPageInformation={pageInfo}
        truncateMessage={truncateMessage}
        type={typedSign[messageParams.version as keyof typeof typedSign]}
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

TypedSign.contextType = ThemeContext;

// Export the unwrapped component for use by other components
export { TypedSign };

interface OwnProps {
  messageParams: TypedSignMessageParams;
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  const chainId = signatureRequest?.chainId;

  return {
    networkType: chainId ? selectProviderTypeByChainId(state, chainId) : undefined,
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TypedSignWithMetrics = withMetricsAwareness(TypedSign as any);
export default connect(mapStateToProps)(TypedSignWithMetrics);
