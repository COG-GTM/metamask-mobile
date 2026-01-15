import React, { useEffect, useCallback, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { SigningBottomSheetSelectorsIDs } from '../../../../../../../e2e/selectors/Browser/SigningBottomSheet.selectors';
import { strings } from '../../../../../../../locales/i18n';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import ExtendedKeyringTypes from '../../../../../../constants/keyringTypes';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../selectors/accountsController';
import { fontStyles } from '../../../../../../styles/common';
import { isHardwareAccount } from '../../../../../../util/address';
import { getAnalyticsParams } from '../../../../../../util/confirmation/signatureUtils';
import Device from '../../../../../../util/device';
import { useTheme } from '../../../../../../util/theme';
import AccountInfoCard from '../../../../../UI/AccountInfoCard';
import ActionView, { ConfirmButtonState } from '../../../../../UI/ActionView';
import QRSigningDetails from '../../../../../UI/QRHardware/QRSigningDetails';
import { useQRHardwareAwareness } from '../../../context/qr-hardware-context/useQRHardwareAwareness';
import WebsiteIcon from '../../../../../UI/WebsiteIcon';
import BlockaidBanner from '../BlockaidBanner/BlockaidBanner';
import { ResultType, SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { PageMeta } from './types';

interface Colors {
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

const getCleanUrl = (url: string): string => {
  try {
    const urlObject = new URL(url);
    return urlObject.origin;
  } catch (error) {
    return '';
  }
};

const createStyles = (colors: Colors) =>
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
  navigation?: unknown;
  showExpandedMessage?: boolean;
  origin?: string;
  domain?: unknown;
}

/**
 * Functional component that renders scrollable content inside signature request user interface
 */
const SignatureRequest = ({
  onReject,
  onConfirm,
  children,
  currentPageInformation,
  type,
  networkType,
  truncateMessage,
  toggleExpandedMessage,
  fromAddress,
  testID,
}: SignatureRequestProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { colors }: any = useTheme();
  const styles = createStyles(colors);

  const { isSigningQRObject, QRState } = useQRHardwareAwareness();

  const selectedAddress = useSelector(selectSelectedInternalAccountFormattedAddress);
  const securityAlertResponse = useSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.signatureRequest.securityAlertResponse as SecurityAlertResponse | undefined,
  );

  const getTrackingParams = useCallback(() => {
    return {
      network: networkType,
      functionType: type,
    };
  }, [networkType, type]);

  const handleReject = useCallback(() => {
    onReject?.();
    trackEvent(
      createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CANCEL_SIGNATURE)
        .addProperties(getTrackingParams())
        .build(),
    );
  }, [onReject, trackEvent, createEventBuilder, getTrackingParams]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    trackEvent(
      createEventBuilder(MetaMetricsEvents.TRANSACTIONS_CONFIRM_SIGNATURE)
        .addProperties(getTrackingParams())
        .build(),
    );
  }, [onConfirm, trackEvent, createEventBuilder, getTrackingParams]);

  useEffect(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContactUsClicked = useCallback(() => {
    const analyticsParams = {
      ...getAnalyticsParams(
        {
          from: fromAddress,
        },
        type,
      ),
      external_link_clicked: 'security_alert_support_link',
    };
    trackEvent(
      createEventBuilder(MetaMetricsEvents.SIGNATURE_REQUESTED)
        .addProperties(analyticsParams)
        .build(),
    );
  }, [fromAddress, type, trackEvent, createEventBuilder]);

  const renderArrowIcon = () => {
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

  const renderActionViewChildren = () => {
    const url = currentPageInformation.url || '';
    const icon = currentPageInformation.icon;
    const title = getCleanUrl(url);
    const arrowIcon = truncateMessage ? renderArrowIcon() : null;

    return (
      <View style={styles.actionViewChild}>
        <View style={styles.accountInfoCardWrapper}>
          <AccountInfoCard
            operation="signing"
            fromAddress={fromAddress || ''}
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

  const renderSignatureRequest = () => {
    let expandedHeight;
    const isLedgerAccount = isHardwareAccount(fromAddress || '', [
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
          onCancelPress={handleReject}
          onConfirmPress={handleConfirm}
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
                onContactUsClicked={onContactUsClicked}
              />
            </View>
            {renderActionViewChildren()}
          </View>
        </ActionView>
      </View>
    );
  };

  const renderQRDetails = () => {
    return (
      <View style={[styles.root]}>
        <QRSigningDetails
          QRState={QRState}
          showCancelButton
          showHint={false}
          bypassAndroidCameraAccessCheck={false}
          fromAddress={fromAddress || ''}
        />
      </View>
    );
  };

  return isSigningQRObject ? renderQRDetails() : renderSignatureRequest();
};

export default SignatureRequest;
