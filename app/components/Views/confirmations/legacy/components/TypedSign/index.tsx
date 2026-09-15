import React, { ComponentType, PureComponent } from 'react';
import { connect } from 'react-redux';
import { LayoutChangeEvent, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { fontStyles } from '../../../../../../styles/common';
import SignatureRequest from '../SignatureRequest';
import ExpandedMessage from '../SignatureRequest/ExpandedMessage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { MetricsEventBuilder } from '../../../../../../core/Analytics/MetricsEventBuilder';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Colors, Theme } from '../../../../../../util/theme/models';
import { RootState } from '../../../../../../reducers';
import { Hex } from '@metamask/utils';
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
import { MessageParams, PageMeta } from '../SignatureRequest/types';
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
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
interface TypedDataV1Field {
  name: string;
  type: string;
  value: string | number | boolean;
}

/**
 * eth_signTypedData V1 sends the typed data fields as an array, V3/V4 as a JSON string
 */
export type TypedSignMessageParams = Omit<MessageParams, 'data'> & {
  data: string | TypedDataV1Field[];
};

export interface TypedSignOwnProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation?: NavigationProp<ParamListBase>;
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject: () => void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm: () => void;
  /**
   * Typed message to be displayed to the user
   */
  messageParams: TypedSignMessageParams;
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

interface TypedSignStateProps {
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
  /**
   * String representing the associated network
   */
  networkType?: string;
}

type TypedSignProps = TypedSignOwnProps &
  TypedSignStateProps &
  IWithMetricsAwarenessProps;

interface TypedSignState {
  truncateMessage: boolean;
}

class TypedSign extends PureComponent<TypedSignProps, TypedSignState> {
  static contextType = ThemeContext;

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
      navigation?.navigate(
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

  renderTypedMessageV3 = (obj: object): JSX.Element[] => {
    const styles = this.getStyles();
    const entries = obj as Record<string, unknown>;
    return Object.keys(entries).map((key) => {
      const value = entries[key];
      return (
        <View style={styles.message} key={key}>
          {value && typeof value === 'object' ? (
            <View>
              <Text style={[styles.messageText, styles.msgKey]}>
                {escapeSpecialUnicode(key)}:
              </Text>
              <View>{this.renderTypedMessageV3(value)}</View>
            </View>
          ) : (
            <Text style={styles.messageText}>
              <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
              {escapeSpecialUnicode(`${value}`)}
            </Text>
          )}
        </View>
      );
    });
  };

  renderTypedMessage = () => {
    const { messageParams } = this.props;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {(messageParams.data as TypedDataV1Field[]).map((obj, i) => (
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
      return this.renderTypedMessageV3(sanitizedMessage as object);
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
    const messageWrapperStyles: ViewStyle[] = [];
    let domain: Record<string, unknown> | undefined;
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
      signatureRequest?.chainId as Hex,
    ),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

// withMetricsAwareness' typing only models the `metrics` prop it injects,
// so the wrapped component's own props are re-asserted on the result.
const TypedSignWithMetrics = withMetricsAwareness(
  TypedSign as unknown as ComponentType<IWithMetricsAwarenessProps>,
) as ComponentType<TypedSignOwnProps & TypedSignStateProps>;

export default connect(mapStateToProps)(TypedSignWithMetrics);
