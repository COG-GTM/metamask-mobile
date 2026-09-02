import React, { ComponentType, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../../../core/Analytics/MetricsEventBuilder';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Colors, Theme } from '../../../../../../util/theme/models';
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
import {
  withMetricsAwareness,
  IUseMetricsHook,
} from '../../../../../../components/hooks/useMetrics';
import { selectProviderTypeByChainId } from '../../../../../../selectors/networkController';
import { selectSignatureRequestById } from '../../../../../../selectors/signatureController';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { MessageParams, PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { RootState } from '../../../../../../reducers';

type TypedSignMessageData =
  | string
  | { name: string; value: string; type?: string }
  | { name: string; value: string; type?: string }[];

interface TypedSignMessageParams extends Omit<MessageParams, 'data'> {
  data: TypedSignMessageData;
}

interface TypedSignOwnProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation?: NavigationProp<ParamListBase>;
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
}

interface TypedSignStateProps {
  /**
   * String representing the associated network
   */
  networkType?: string;
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
}

type TypedSignProps = TypedSignOwnProps &
  TypedSignStateProps & {
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: IUseMetricsHook;
  };

interface TypedSignState {
  truncateMessage: boolean;
}

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
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  static propTypes = {
    /**
     * react-navigation object used for switching between screens
     */
    navigation: PropTypes.object,
    /**
     * Callback triggered when this message signature is rejected
     */
    onReject: PropTypes.func,
    /**
     * Callback triggered when this message signature is approved
     */
    onConfirm: PropTypes.func,
    /**
     * Typed message to be displayed to the user
     */
    messageParams: PropTypes.object,
    /**
     * Object containing current page title and url
     */
    currentPageInformation: PropTypes.object,
    /**
     * Hides or shows the expanded signing message
     */
    toggleExpandedMessage: PropTypes.func,
    /**
     * Indicated whether or not the expanded message is shown
     */
    showExpandedMessage: PropTypes.bool,
    /**
     * Security alert response object
     */
    securityAlertResponse: PropTypes.object,
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: PropTypes.object,
    /**
     * String representing the associated network
     */
    networkType: PropTypes.string,
  };

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
        .addProperties(
          getAnalyticsParams(
            messageParams as unknown as Parameters<
              typeof getAnalyticsParams
            >[0],
            'typed_sign',
          ),
        )
        .build(),
    );
    addSignatureErrorListener(
      metamaskId,
      this.onSignatureError as unknown as Parameters<
        typeof addSignatureErrorListener
      >[1],
    );
  };

  componentWillUnmount = () => {
    const {
      messageParams: { metamaskId },
    } = this.props;
    removeSignatureErrorListener(
      metamaskId,
      this.onSignatureError as unknown as Parameters<
        typeof removeSignatureErrorListener
      >[1],
    );
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
    showWalletConnectNotification(
      this.props.messageParams as unknown as Parameters<
        typeof showWalletConnectNotification
      >[0],
      false,
      true,
    );
  };

  rejectSignature = async () => {
    const { messageParams, onReject, securityAlertResponse } = this.props;
    await handleSignatureAction(
      onReject as () => void,
      messageParams as unknown as Parameters<typeof handleSignatureAction>[1],
      typedSign[messageParams.version as keyof typeof typedSign],
      securityAlertResponse as unknown as Parameters<
        typeof handleSignatureAction
      >[3],
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
        onConfirm as () => void,
        messageParams as unknown as Parameters<typeof handleSignatureAction>[1],
        typedSign[messageParams.version as keyof typeof typedSign],
        securityAlertResponse as unknown as Parameters<
          typeof handleSignatureAction
        >[3],
        true,
      );
    } else {
      (
        navigation as NavigationProp<ParamListBase> & {
          navigate: (...args: never[]) => void;
        }
      ).navigate(
        ...((await createExternalSignModelNav(
          onReject as () => void,
          onConfirm as () => void,
          messageParams,
          typedSign[messageParams.version as keyof typeof typedSign],
        )) as unknown as never[]),
      );
    }
  };

  updateShouldTruncateMessage = (e: LayoutChangeEvent) => {
    const truncateMessage = shouldTruncateMessage(e);
    this.setState({ truncateMessage });
  };

  getStyles = () => {
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderTypedMessageV3 = (obj: Record<string, unknown>) => {
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

  renderTypedMessage = () => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {(
            messageParams.data as unknown as { name: string; value: string }[]
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
        messageParams.data as string,
      );
      return this.renderTypedMessageV3(
        sanitizedMessage as unknown as Record<string, unknown>,
      );
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
    const messageWrapperStyles: StyleProp<ViewStyle>[] = [];
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
        currentPageInformation={currentPageInformation as PageMeta}
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
            (truncateMessage
              ? null
              : this.updateShouldTruncateMessage) as ViewProps['onLayout']
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
  ownProps: TypedSignOwnProps,
): TypedSignStateProps => {
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(
      state,
      signatureRequest?.chainId as `0x${string}`,
    ),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

export default connect(mapStateToProps)(
  withMetricsAwareness(
    TypedSign as unknown as ComponentType<IWithMetricsAwarenessProps>,
  ),
);
