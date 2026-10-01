/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Legacy confirmations subsystem; types being incrementally added
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  LayoutChangeEvent,
} from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../../../core/Analytics/MetricsEventBuilder';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Theme } from '../../../../../../util/theme/models';
import { escapeSpecialUnicode } from '../../../../../../util/string';
import { parseAndSanitizeSignTypedData } from '../../../../../../components/Views/confirmations/utils/signature';
import type { PageMeta } from '../SignatureRequest/types';

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
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create<{
    messageText: TextStyle;
    message: ViewStyle;
    truncatedMessageWrapper: ViewStyle;
    iosHeight: ViewStyle;
    androidHeight: ViewStyle;
    msgKey: TextStyle;
  }>({
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
  metamaskId?: string;
  from: string;
  version: 'V1' | 'V3' | 'V4' | string;
  // For V1, data is an array of {name, value}; for V3/V4, data is a JSON string.
  data: string | { name: string; value: unknown }[];
  origin?: string;
}

interface OwnProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject: () => Promise<void> | void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm: () => Promise<void> | void;
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
  showExpandedMessage: boolean;
}

interface StateProps {
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
  /**
   * String representing the associated network
   */
  networkType?: string;
}

type Props = OwnProps & StateProps & IWithMetricsAwarenessProps;

interface State {
  truncateMessage: boolean;
}

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
class TypedSign extends PureComponent<Props, State> {
  static contextType = ThemeContext;

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
    const colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderTypedMessageV3 = (obj: Record<string, unknown>): React.ReactNode => {
    const styles = this.getStyles();
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {obj[key] && typeof obj[key] === 'object' ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>
              {this.renderTypedMessageV3(obj[key] as Record<string, unknown>)}
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

  renderTypedMessage = (): React.ReactNode => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1' && Array.isArray(messageParams.data)) {
      return (
        <View style={styles.message}>
          {messageParams.data.map((obj, i: number) => (
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
      return this.renderTypedMessageV3(
        sanitizedMessage as Record<string, unknown>,
      );
    }
    return null;
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
    const messageWrapperStyles: StyleProp<ViewStyle>[] = [];
    let domain: unknown;
    const styles = this.getStyles();

    if (messageParams.version === 'V3' && typeof messageParams.data === 'string') {
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
          onLayout={truncateMessage ? undefined : this.updateShouldTruncateMessage}
        >
          {this.renderTypedMessage()}
        </View>
      </SignatureRequest>
    );
    return rootView;
  }
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId ?? '',
  );

  return {
    networkType: selectProviderTypeByChainId(state, signatureRequest?.chainId),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

const __Connected = connect(mapStateToProps)(withMetricsAwareness(TypedSign));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default __Connected as unknown as React.ComponentType<any>;
