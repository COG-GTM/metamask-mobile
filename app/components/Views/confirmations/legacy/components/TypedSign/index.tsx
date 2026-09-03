import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { LayoutChangeEvent, StyleSheet, View, Text } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Theme } from '@metamask/design-tokens';
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
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { MessageParams, PageMeta } from '../SignatureRequest/types';

const createStyles = (colors: Theme['colors']) =>
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
interface TypedSignMessageParams extends Omit<MessageParams, 'data'> {
  data:
    | string
    | { name: string; value: string }[]
    | { type: string; name: string; value: string };
}

interface OwnProps {
  /** react-navigation object used for switching between screens */
  navigation?: NavigationProp<ParamListBase>;
  /** Callback triggered when this message signature is rejected */
  onReject?: () => void;
  /** Callback triggered when this message signature is approved */
  onConfirm?: () => void;
  /** Typed message to be displayed to the user */
  messageParams?: TypedSignMessageParams;
  /** Object containing current page title and url */
  currentPageInformation?: PageMeta;
  /** Hides or shows the expanded signing message */
  toggleExpandedMessage?: () => void;
  /** Indicated whether or not the expanded message is shown */
  showExpandedMessage?: boolean;
}

interface StateProps {
  securityAlertResponse?: unknown;
  networkType?: string;
}

interface State {
  truncateMessage: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type Props = OwnProps & StateProps & IWithMetricsAwarenessProps;

class TypedSign extends PureComponent<Props, State> {
  context: React.ContextType<typeof ThemeContext> =
    undefined as React.ContextType<typeof ThemeContext>;
  state: State = {
    truncateMessage: false,
  };

  componentDidMount = () => {
    if (!this.props.messageParams) return;
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
    if (!this.props.messageParams) return;
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
    if (this.props.messageParams) {
      showWalletConnectNotification(this.props.messageParams, false, true);
    }
  };

  rejectSignature = async () => {
    const { messageParams, onReject, securityAlertResponse } = this.props;
    if (!messageParams) return;
    await handleSignatureAction(
      onReject,
      messageParams,
      messageParams.version
        ? typedSign[messageParams.version as keyof typeof typedSign]
        : undefined,
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
    if (!messageParams) return;
    if (!isExternalHardwareAccount(messageParams.from)) {
      await handleSignatureAction(
        onConfirm,
        messageParams,
        messageParams.version
          ? typedSign[messageParams.version as keyof typeof typedSign]
          : undefined,
        securityAlertResponse,
        true,
      );
    } else if (navigation && onReject && onConfirm) {
      navigation.navigate(
        ...(await createExternalSignModelNav(
          onReject,
          onConfirm,
          messageParams,
          typedSign[messageParams.version as keyof typeof typedSign],
        )) as [string, object],
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

  renderTypedMessageV3 = (obj: Record<string, unknown>) => {
    const styles = this.getStyles();
    return Object.keys(obj).map((key) => (
      <View style={styles.message} key={key}>
        {(() => {
          const value = obj[key];
          return isRecord(value) ? (
          <View>
            <Text style={[styles.messageText, styles.msgKey]}>
              {escapeSpecialUnicode(key)}:
            </Text>
            <View>
              {this.renderTypedMessageV3(value)}
            </View>
          </View>
          ) : (
          <Text style={styles.messageText}>
            <Text style={styles.msgKey}>{escapeSpecialUnicode(key)}:</Text>{' '}
            {escapeSpecialUnicode(`${obj[key]}`)}
          </Text>
          );
        })()}
      </View>
    ));
  };

  renderTypedMessage = () => {
    const { messageParams } = this.props;
    if (!messageParams) return null;
    const styles = this.getStyles();

    if (messageParams.version === 'V1') {
      return (
        <View style={styles.message}>
          {(messageParams.data as { name: string; value: string }[]).map(
            (obj, i) => (
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
      if (typeof messageParams.data !== 'string') return null;
      const { sanitizedMessage } = parseAndSanitizeSignTypedData(
        messageParams.data,
      );
      return isRecord(sanitizedMessage)
        ? this.renderTypedMessageV3(sanitizedMessage)
        : null;
    }
  };

  render() {
    const {
      messageParams,
      currentPageInformation,
      showExpandedMessage,
      toggleExpandedMessage,
      networkType,
    } = this.props;
    if (!messageParams) return null;
    const { from } = messageParams;
    const { truncateMessage } = this.state;
    const messageWrapperStyles = [];
    let domain;
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
        currentPageInformation={
          currentPageInformation || { title: '', url: '' }
        }
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
        type={
          messageParams.version
            ? typedSign[messageParams.version as keyof typeof typedSign]
            : undefined
        }
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

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  if (!ownProps.messageParams) {
    return {
      networkType: undefined,
      securityAlertResponse: state.signatureRequest.securityAlertResponse,
    };
  }
  const signatureRequest = selectSignatureRequestById(
    state,
    ownProps.messageParams.metamaskId,
  );

  return {
    networkType: selectProviderTypeByChainId(
      state,
      signatureRequest?.chainId || '0x0',
    ),
    securityAlertResponse: state.signatureRequest.securityAlertResponse,
  };
};

export default connect(mapStateToProps)(withMetricsAwareness(TypedSign));
