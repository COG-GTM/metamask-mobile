import React, { PureComponent, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { strings } from '../../../../../../../locales/i18n';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import ExtendedKeyringTypes from '../../../../../../constants/keyringTypes';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../selectors/accountsController';
import { fontStyles } from '../../../../../../styles/common';
import { isHardwareAccount } from '../../../../../../util/address';
import { getAnalyticsParams } from '../../../../../../util/confirmation/signatureUtils';
import Device from '../../../../../../util/device';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Theme } from '../../../../../../util/theme/models';
import AccountInfoCard from '../../../../../UI/AccountInfoCard';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import withQRHardwareAwareness from '../../../../../UI/QRHardware/withQRHardwareAwareness';
import { IQRState } from '../../../../../UI/QRHardware/types';
import WebsiteIcon from '../../../../../UI/WebsiteIcon';
import BlockaidBanner from '../BlockaidBanner/BlockaidBanner';
import { ResultType, SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { PageMeta } from './types';
import { RootState } from '../../../../../../reducers';

const getCleanUrl = (url: string): string => {
  try {
    const urlObject = new URL(url);
    return urlObject.origin;
  } catch (error) {
    return '';
  }
};

const createStyles = (colors: Theme['colors']) =>
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

export interface SignatureRequestProps {
  onReject?: () => void;
  onConfirm?: () => void;
  children?: ReactNode;
  currentPageInformation: PageMeta;
  type?: string;
  networkType?: string;
  truncateMessage?: boolean;
  toggleExpandedMessage?: () => void;
  fromAddress?: string;
  testID?: string;
  securityAlertResponse?: SecurityAlertResponse;
  selectedAddress?: string;
  isSigningQRObject?: boolean;
  QRState?: IQRState;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domain?: any;
  showExpandedMessage?: boolean;
  origin?: string;
  // Injected by withMetricsAwareness HOC
  metrics: IWithMetricsAwarenessProps['metrics'];
}

interface ThemeContextType {
  colors: Theme['colors'];
}

class SignatureRequest extends PureComponent<SignatureRequestProps> {
  static contextType = ThemeContext;
  declare context: ThemeContextType;

  componentDidMount = () => {
    const { currentPageInformation, type, fromAddress, metrics } = this.props;

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
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

  onReject = () => {
    const { onReject, metrics } = this.props;
    onReject?.();
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_SIGNATURE)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  onConfirm = () => {
    const { onConfirm, metrics } = this.props;
    onConfirm?.();
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_SIGNATURE)
        .addProperties(this.getTrackingParams())
        .build(),
    );
  };

  getTrackingParams = () => {
    const { type, networkType } = this.props;
    return {
      network: networkType,
      functionType: type,
    };
  };

  getStyles = () => {
    const colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderActionViewChildren = () => {
    const {
      children,
      currentPageInformation,
      truncateMessage,
      toggleExpandedMessage,
      fromAddress = '',
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
            fromAddress={fromAddress}
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

  renderArrowIcon = () => {
    const styles = this.getStyles();

    return (
      <View style={styles.arrowIconWrapper}>
        <Ionicons name={'arrow-forward'} size={20} style={styles.arrowIcon} />
      </View>
    );
  };

  onContactUsClicked = () => {
    const { fromAddress, type, metrics } = this.props;
    const analyticsParams = {
      ...getAnalyticsParams(
        {
          from: fromAddress,
        },
        type,
      ),
      external_link_clicked: 'security_alert_support_link',
    };
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  renderSignatureRequest() {
    const { securityAlertResponse, fromAddress = '', testID } = this.props;
    let expandedHeight;
    const styles = this.getStyles();
    const isLedgerAccount = isHardwareAccount(fromAddress, [
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
      <View testID={testID} style={[styles.root, expandedHeight]}>
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

  renderQRDetails() {
    const { QRState, fromAddress = '' } = this.props;
    const styles = this.getStyles();

    // Only render if QRState is available
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
          fromAddress={fromAddress}
        />
      </View>
    );
  }

  render() {
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignatureRequestWithHOCs = withQRHardwareAwareness(
  withMetricsAwareness(SignatureRequest as any) as any,
);

export default connect(mapStateToProps)(SignatureRequestWithHOCs);
