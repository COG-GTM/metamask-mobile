import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import WebsiteIcon from '../WebsiteIcon';
import { getHost, getUrlObj } from '../../../util/browser';
import networkList from '../../../util/networks';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AppConstants from '../../../core/AppConstants';
import { renderShortAddress } from '../../../util/address';
import { WALLET_CONNECT_ORIGIN } from '../../../util/walletconnect';
import { useTheme } from '../../../util/theme';
import {
  selectNickname,
  selectProviderType,
} from '../../../selectors/networkController';
import { INTERNAL_ORIGINS } from '../../../constants/transaction';
import { TransactionReviewSelectorsIDs } from '../../../../e2e/selectors/SendFlow/TransactionReview.selectors';
import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';

const { ORIGIN_DEEPLINK, ORIGIN_QR_CODE } = AppConstants.DEEPLINKS;

interface NetworkInfo {
  color?: string;
  shortName?: string;
}

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    transactionHeader: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    domainLogo: {
      width: 56,
      height: 56,
      borderRadius: 32,
    },
    assetLogo: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    domanUrlContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 10,
    },
    secureIcon: {
      marginRight: 5,
      color: colors.text.default,
    },
    domainUrl: {
      ...fontStyles.bold,
      textAlign: 'center',
      fontSize: 14,
      color: colors.text.default,
    },
    networkContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    networkStatusIndicator: {
      borderRadius: 2.5,
      height: 5,
      width: 5,
    },
    network: {
      ...fontStyles.normal,
      textAlign: 'center',
      fontSize: 12,
      padding: 5,
      color: colors.text.default,
      textTransform: 'capitalize',
    },
    deeplinkIconContainer: {
      borderWidth: 1,
      borderColor: colors.border.default,
      width: 56,
      height: 56,
      borderRadius: 38,
    },
    deeplinkIcon: {
      alignSelf: 'center',
      lineHeight: 56,
    },
  });

interface CurrentPageInformation {
  url?: string;
  origin?: string;
  currentEnsName?: string;
  spenderAddress?: string;
  icon?: string | { uri: string };
}

interface TransactionHeaderProps {
  currentPageInformation: CurrentPageInformation;
  networkType: string;
  nickname?: string;
}

const TransactionHeader = (props: TransactionHeaderProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const originIsDeeplink =
    props.currentPageInformation.origin === ORIGIN_DEEPLINK ||
    props.currentPageInformation.origin === ORIGIN_QR_CODE;
  const originIsWalletConnect = props.currentPageInformation.origin?.startsWith(
    WALLET_CONNECT_ORIGIN,
  );

  const originIsMMSDKRemoteConn =
    props.currentPageInformation.origin?.startsWith(
      AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
    );

  const renderNetworkStatusIndicator = () => {
    const { networkType } = props;
    const networkInfo = (networkList as Record<string, NetworkInfo>)[networkType];
    const networkStatusIndicatorColor =
      (networkInfo && networkInfo.color) ||
      colors.error.default;
    const networkStatusIndicator = (
      <View
        style={[
          styles.networkStatusIndicator,
          { backgroundColor: networkStatusIndicatorColor },
        ]}
      />
    );
    return networkStatusIndicator;
  };

  const renderSecureIcon = () => {
    if (originIsDeeplink) return null;
    const { url, origin } = props.currentPageInformation;
    const name =
      getUrlObj(
        originIsWalletConnect
          ? origin?.split(WALLET_CONNECT_ORIGIN)[1] || ''
          : originIsMMSDKRemoteConn
          ? origin?.split(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN)[1] || ''
          : url || '',
      ).protocol === 'https:'
        ? 'lock'
        : 'warning';
    return <FontAwesome name={name} size={15} style={styles.secureIcon} />;
  };

  const renderTopIcon = () => {
    const { currentEnsName, icon, origin } = props.currentPageInformation;
    let url = props.currentPageInformation.url;
    if (originIsDeeplink && !icon) {
      return (
        <View style={styles.deeplinkIconContainer}>
          <FontAwesome
            style={styles.deeplinkIcon}
            name={origin === ORIGIN_DEEPLINK ? 'link' : 'qrcode'}
            size={32}
            color={colors.text.default}
          />
        </View>
      );
    }
    let iconTitle = getHost(currentEnsName || url);
    if (originIsWalletConnect && origin) {
      url = origin.split(WALLET_CONNECT_ORIGIN)[1];
      iconTitle = getHost(url);
    } else if (originIsMMSDKRemoteConn && origin) {
      url = origin.split(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN)[1];
    }
    return (
      <WebsiteIcon
        style={styles.domainLogo}
        viewStyle={styles.assetLogo}
        title={iconTitle}
        url={currentEnsName || url}
        icon={typeof icon === 'string' ? icon : icon?.uri}
      />
    );
  };

  const renderTitle = () => {
    const { url, currentEnsName, spenderAddress, origin } =
      props.currentPageInformation;
    let title = '';

    if (originIsDeeplink) title = renderShortAddress(spenderAddress);
    else if (originIsWalletConnect && origin)
      title = getHost(origin.split(WALLET_CONNECT_ORIGIN)[1]);
    else if (originIsMMSDKRemoteConn && origin) {
      title = getHost(origin.split(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN)[1]);
    }

    if (!title) title = getHost(currentEnsName || url || origin);

    return <Text style={styles.domainUrl}>{title}</Text>;
  };

  const renderDomainUrlContainer = () => (
    <View
      style={styles.domanUrlContainer}
      testID={TransactionReviewSelectorsIDs.TRANSACTION_HEADER_ORIGIN}
    >
      {renderSecureIcon()}
      {renderTitle()}
    </View>
  );

  const renderNetworkContainer = () => {
    const networkInfo = (networkList as Record<string, NetworkInfo>)[props.networkType];
    return (
      <View style={styles.networkContainer}>
        {renderNetworkStatusIndicator()}
        <Text style={styles.network}>
          {props.nickname || networkInfo?.shortName}
        </Text>
      </View>
    );
  };

  const showOrigin = !INTERNAL_ORIGINS.includes(
    props.currentPageInformation.origin || '',
  );

  return (
    <View style={styles.transactionHeader}>
      {renderTopIcon()}
      {!showOrigin ? null : renderDomainUrlContainer()}
      {renderNetworkContainer()}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  networkType: selectProviderType(state),
  nickname: selectNickname(state),
});

export default connect(mapStateToProps)(TransactionHeader);
