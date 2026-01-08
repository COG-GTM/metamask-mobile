import React, { PureComponent, ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { strings } from '../../../../../../../locales/i18n';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import ExtendedKeyringTypes from '../../../../../../constants/keyringTypes';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../selectors/accountsController';
import { fontStyles } from '../../../../../../styles/common';
import { isHardwareAccount } from '../../../../../../util/address';
import { getAnalyticsParams } from '../../../../../../util/confirmation/signatureUtils';
import Device from '../../../../../../util/device';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import AccountInfoCard from '../../../../../UI/AccountInfoCard';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import withQRHardwareAwareness from '../../../../../UI/QRHardware/withQRHardwareAwareness';
import WebsiteIcon from '../../../../../UI/WebsiteIcon';
import BlockaidBanner from '../BlockaidBanner/BlockaidBanner';
import { ResultType, SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { RootState } from '../../../../../../reducers';
import { IUseMetricsHook } from '../../../../../hooks/useMetrics/useMetrics.types';
import { IQRState } from '../../../../../UI/QRHardware/types';
import { PageMeta } from './types';
import { Theme } from '../../../../../../util/theme/models';

const getCleanUrl = (url: string): string => {
  try {
    const urlObject = new URL(url);

    return urlObject.origin;
  } catch (error) {
    return '';
  }
};

interface SignatureRequestStyles {
  root: ViewStyle;
  expandedHeight2: ViewStyle;
  expandedHeight1: ViewStyle;
  signingInformation: ViewStyle;
  domainLogo: ViewStyle;
  messageColumn: ViewStyle;
  warningLink: TextStyle;
  signText: TextStyle;
  messageLabelText: TextStyle;
  readMore: TextStyle;
  warningWrapper: ViewStyle;
  actionViewChild: ViewStyle;
  accountInfoCardWrapper: ViewStyle;
  children: ViewStyle;
  arrowIconWrapper: ViewStyle;
  arrowIcon: TextStyle;
  blockaidBannerContainer: ViewStyle;
}

interface ThemeColors {
  background: {
    default: string;
  };
  text: {
    default: string;
  };
  primary: {
    default: string;
  };
  border: {
    default: string;
  };
  icon: {
    muted: string;
  };
}

const createStyles = (colors: ThemeColors): SignatureRequestStyles =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      paddingTop: 24,
      minHeight: '90%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Device.isIphoneX() ? 20 : 0,
    },
    expandedHeight2: {
      minHeight: '90%',
    },
    expandedHeight1: {
      minHeight: '90%',
    },
    signingInformation: {
      alignItems: 'center',
      marginVertical: 24,
    },
    domainLogo: {
      width: 40,
      height: 40,
      marginRight: 8,
      borderRadius: 20,
    },
    messageColumn: {
      width: '75%',
      justifyContent: 'space-between',
    },
    warningLink: {
      ...fontStyles.normal,
      color: colors.primary.default,
      textAlign: 'center',
      paddingHorizontal: 10,
      paddingBottom: 10,
      textDecorationLine: 'underline',
    },
    signText: {
      ...fontStyles.bold,
      fontSize: 20,
      textAlign: 'center',
      color: colors.text.default,
    },
    messageLabelText: {
      ...fontStyles.bold,
      fontSize: 16,
      marginBottom: 4,
      color: colors.text.default,
    },
    readMore: {
      color: colors.primary.default,
      fontSize: 14,
      ...fontStyles.bold,
    },
    warningWrapper: {
      width: '100%',
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    actionViewChild: {
      paddingHorizontal: 24,
    },
    accountInfoCardWrapper: {
      marginBottom: 20,
      width: '100%',
    },
    children: {
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 10,
      padding: 16,
    },
    arrowIconWrapper: {
      flexGrow: 1,
      alignItems: 'flex-end',
    },
    arrowIcon: {
      color: colors.icon.muted,
    },
    blockaidBannerContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
  });

/**
 * Props for the SignatureRequest component
 */
interface SignatureRequestProps {
  /** Callback triggered when this message signature is rejected */
  onReject?: () => void;
  /** Callback triggered when this message signature is approved */
  onConfirm?: () => void;
  /** Content to display above the action buttons */
  children?: ReactNode;
  /** Object containing current page title and url */
  currentPageInformation: PageMeta;
  /** String representing signature type */
  type?: string;
  /** String representing the associated network */
  networkType?: string;
  /** Whether it should render the expand arrow icon */
  truncateMessage?: boolean;
  /** Expands the message box on press */
  toggleExpandedMessage?: () => void;
  /** Active address of account that triggered signing */
  fromAddress?: string;
  /** Whether the user is signing a QR object */
  isSigningQRObject?: boolean;
  /** QR state object */
  QRState?: IQRState;
  /** Test ID for the component */
  testID?: string;
  /** Security alert response from Blockaid */
  securityAlertResponse?: SecurityAlertResponse;
  /** Metrics injected by withMetricsAwareness HOC */
  metrics?: IUseMetricsHook;
  /** Selected address from Redux state */
  selectedAddress?: string;
  /** Navigation object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  /** Whether the expanded message is shown */
  showExpandedMessage?: boolean;
  /** Domain information for typed sign */
  domain?: unknown;
  /** Origin of the request */
  origin?: string;
}

interface TrackingParams {
  [key: string]: string | undefined;
  network?: string;
  functionType?: string;
}

/**
 * PureComponent that renders scrollable content inside signature request user interface
 */
class SignatureRequest extends PureComponent<SignatureRequestProps> {
  declare context: Theme;

  /**
   * Calls trackCancelSignature and onReject callback
   */
  onReject = (): void => {
    this.props.onReject?.();
    this.props.metrics?.trackEvent(
      this.props.metrics
        ?.createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_SIGNATURE)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Calls trackConfirmSignature and onConfirm callback
   */
  onConfirm = (): void => {
    this.props.onConfirm?.();
    this.props.metrics?.trackEvent(
      this.props.metrics
        ?.createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_SIGNATURE)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  /**
   * Returns corresponding tracking params to send
   */
  getTrackingParams = (): TrackingParams => {
    const { type, networkType } = this.props;
    return {
      network: networkType,
      functionType: type,
    };
  };

  getStyles = (): SignatureRequestStyles => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  componentDidMount = (): void => {
    const { currentPageInformation, type, fromAddress } = this.props;

    this.props.metrics?.trackEvent(
      this.props.metrics
        ?.createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(
          getAnalyticsParams(
            {
              currentPageInformation,
              from: fromAddress,
            },
            type,
          ),
        )
        .build(),
    );
  };

  renderActionViewChildren = (): ReactNode => {
    const {
      children,
      currentPageInformation,
      truncateMessage,
      toggleExpandedMessage,
      fromAddress,
    } = this.props;
    const styles = this.getStyles();
    const url = currentPageInformation.url;
    const icon = currentPageInformation.icon;

    const title = getCleanUrl(url);
    const arrowIcon = truncateMessage ? this.renderArrowIcon() : null;

    return (
      <View style={styles.actionViewChild}>
        <View style={styles.accountInfoCardWrapper}>
          <AccountInfoCard
            operation="signing"
            fromAddress={fromAddress ?? ''}
            origin={title}
          />
        </View>
        <TouchableOpacity
          style={styles.children}
          onPress={truncateMessage ? toggleExpandedMessage : undefined}
        >
          <WebsiteIcon
            style={styles.domainLogo}
            title={title}
            url={url}
            icon={icon}
          />
          <View style={styles.messageColumn}>
            <Text style={styles.messageLabelText}>
              {strings('signature_request.message')}:
            </Text>
            {children}
            {truncateMessage ? (
              <Text style={styles.readMore}>
                {strings('signature_request.read_more')}
              </Text>
            ) : null}
          </View>
          <View style={styles.arrowIconWrapper}>{arrowIcon}</View>
        </TouchableOpacity>
      </View>
    );
  };

  renderArrowIcon = (): ReactNode => {
    const styles = this.getStyles();

    return (
      <View style={styles.arrowIconWrapper}>
        <Ionicons
          name={'arrow-forward'}
          size={20}
          style={styles.arrowIcon}
        />
      </View>
    );
  };

  onContactUsClicked = (): void => {
    const { fromAddress, type } = this.props;
    const analyticsParams = {
      ...getAnalyticsParams(
        {
          from: fromAddress,
        },
        type,
      ),
      external_link_clicked: 'security_alert_support_link',
    };
    this.props.metrics?.trackEvent(
      this.props.metrics
        ?.createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  renderSignatureRequest(): ReactNode {
    const { securityAlertResponse, fromAddress } = this.props;
    let expandedHeight: ViewStyle | undefined;
    const styles = this.getStyles();
    const isLedgerAccount = isHardwareAccount(fromAddress ?? '', [
      ExtendedKeyringTypes.ledger,
    ]);

    if (Device.isMediumDevice()) {
      expandedHeight = styles.expandedHeight2;
    }

    let confirmButtonState = ConfirmButtonState.Normal;
    if (securityAlertResponse?.result_type === ResultType.Malicious) {
      confirmButtonState = ConfirmButtonState.Error;
    } else if (securityAlertResponse?.result_type === ResultType.Warning) {
      confirmButtonState = ConfirmButtonState.Warning;
    }

    return (
      <View testID={this.props.testID} style={[styles.root, expandedHeight]}>
        <ActionView
          cancelTestID={SigningBottomSheetSelectorsIDs.CANCEL_BUTTON}
          confirmTestID={SigningBottomSheetSelectorsIDs.SIGN_BUTTON}
          cancelText={strings('signature_request.cancel')}
          confirmText={
            isLedgerAccount
              ? strings('ledger.sign_with_ledger')
              : strings('signature_request.sign')
          }
          onCancelPress={this.onReject}
          onConfirmPress={this.onConfirm}
          confirmButtonMode="sign"
          confirmButtonState={confirmButtonState}
        >
          <View>
            <View style={styles.signingInformation}>
              <Text style={styles.signText}>
                {strings('signature_request.signing')}
              </Text>
            </View>
            <View style={styles.blockaidBannerContainer}>
              <BlockaidBanner
                securityAlertResponse={securityAlertResponse}
                onContactUsClicked={this.onContactUsClicked}
              />
            </View>
            {this.renderActionViewChildren()}
          </View>
        </ActionView>
      </View>
    );
  }

  renderQRDetails(): ReactNode {
    const { QRState, fromAddress } = this.props;
    const styles = this.getStyles();

    if (!QRState) {
      return null;
    }

    return (
      <View style={[styles.root]}>
        <QRSigningDetails
          QRState={QRState}
          showCancelButton
          showHint={false}
          bypassAndroidCameraAccessCheck={false}
          fromAddress={fromAddress ?? ''}
        />
      </View>
    );
  }

  render(): ReactNode {
    const { isSigningQRObject } = this.props;
    return isSigningQRObject
      ? this.renderQRDetails()
      : this.renderSignatureRequest();
  }
}

const mapStateToProps = (state: RootState) => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  securityAlertResponse: state.signatureRequest.securityAlertResponse,
});

SignatureRequest.contextType = ThemeContext;

// Export the unwrapped component for use by other components
export { SignatureRequest };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignatureRequestWithMetrics = withMetricsAwareness(SignatureRequest as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignatureRequestWithQR = withQRHardwareAwareness(SignatureRequestWithMetrics as any);
export default connect(mapStateToProps)(SignatureRequestWithQR);
