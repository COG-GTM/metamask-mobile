import isUrl from 'is-url';
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectEvmTicker } from '../../../selectors/networkController';
import { fontStyles } from '../../../styles/common';
import {
  getLabelTextByAddress,
  renderAccountName,
  renderShortAddress,
  safeToChecksumAddress,
} from '../../../util/address';
import Device from '../../../util/device';
import { hexToBN, renderFromWei, weiToFiat } from '../../../util/number';
import { ThemeContext, mockTheme } from '../../../util/theme';
import {
  getActiveTabUrl,
  getNormalizedTxState,
  getTicker,
} from '../../../util/transactions';
import ApproveTransactionHeader from '../../Views/confirmations/legacy/components/ApproveTransactionHeader';
import Identicon from '../Identicon';
import { selectInternalAccounts } from '../../../selectors/accountsController';
import { RootState } from '../../../reducers';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    accountInformation: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 10,
      padding: Device.isMediumDevice() ? 8 : 16,
      alignItems: 'center',
    },
    identicon: {
      marginRight: 8,
    },
    accountInfoRow: {
      flexGrow: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginRight: 8,
    },
    accountNameAndAddress: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    accountName: {
      maxWidth: Device.isMediumDevice() ? '35%' : '45%',
      ...fontStyles.bold,
      fontSize: 16,
      marginRight: 2,
      color: colors.text.default,
    },
    accountNameSmall: {
      fontSize: 12,
    },
    accountAddress: {
      flexGrow: 1,
      ...fontStyles.bold,
      fontSize: 16,
      color: colors.text.default,
    },
    accountAddressSmall: {
      fontSize: 12,
    },
    balanceText: {
      ...fontStyles.thin,
      fontSize: 14,
      alignSelf: 'flex-start',
      color: colors.text.default,
    },
    balanceTextSmall: {
      fontSize: 12,
    },
    tag: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.text.default,
      padding: 4,
      minWidth: 42,
    },
    tagText: {
      textAlign: 'center',
      color: colors.text.default,
    },
  });

const mapStateToProps = (state: RootState) => ({
  accounts: selectAccounts(state),
  internalAccounts: selectInternalAccounts(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
  transaction: getNormalizedTxState(state),
  activeTabUrl: getActiveTabUrl(state),
});

interface AccountInfoCardOwnProps {
  fromAddress: string;
  operation?: string;
  showFiatBalance?: boolean;
  origin?: string;
}

type AccountInfoCardProps = AccountInfoCardOwnProps &
  ReturnType<typeof mapStateToProps>;

class AccountInfoCard extends PureComponent<AccountInfoCardProps> {

  render() {
    const {
      accounts,
      internalAccounts,
      conversionRate,
      currentCurrency,
      operation,
      ticker,
      showFiatBalance = true,
      fromAddress: rawFromAddress,
      transaction,
      origin,
    } = this.props;

    const fromAddress = safeToChecksumAddress(rawFromAddress) as string;
    const accountLabelTag = getLabelTextByAddress(fromAddress);
    const colors = (this.context as React.ContextType<typeof ThemeContext>).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const accountBalanceHex = (
      accounts as Record<string, { balance?: string } | undefined>
    )?.[fromAddress]?.balance;
    const weiBalance = accountBalanceHex ? hexToBN(accountBalanceHex) : 0;
    const balance = `${renderFromWei(weiBalance)} ${getTicker(ticker)}`;
    const accountLabel = renderAccountName(fromAddress, internalAccounts);
    const address = renderShortAddress(fromAddress);
    const dollarBalance = showFiatBalance
      ? weiToFiat(weiBalance, conversionRate, currentCurrency, 2)?.toUpperCase()
      : undefined;

    const sdkConnections = SDKConnect.getInstance().getConnections();

    const currentConnection = sdkConnections[origin ?? ''];

    const isOriginUrl = isUrl(origin as string);

    const originatorInfo = currentConnection?.originatorInfo;

    const sdkDappMetadata = {
      url: isOriginUrl
        ? (origin as string)
        : originatorInfo?.url ?? strings('sdk.unknown'),
      icon: originatorInfo?.icon,
    };
    const actualOriginUrl = isOriginUrl
      ? (origin as string)
      : originatorInfo?.url ?? strings('sdk.unknown');

    return operation === 'signing' && transaction !== undefined ? (
      <ApproveTransactionHeader
        {...({
          origin: actualOriginUrl,
          url: actualOriginUrl,
          from: rawFromAddress,
          sdkDappMetadata: sdkDappMetadata as { url: string; icon: string },
        } as React.ComponentProps<typeof ApproveTransactionHeader>)}
      />
    ) : (
      <View style={styles.accountInformation}>
        <Identicon
          address={fromAddress}
          diameter={40}
          customStyle={styles.identicon}
        />
        <View style={styles.accountInfoRow}>
          <View style={styles.accountNameAndAddress}>
            <Text
              numberOfLines={1}
              style={[
                styles.accountName,
                accountLabelTag ? styles.accountNameSmall : undefined,
              ]}
            >
              {accountLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.accountAddress,
                accountLabelTag ? styles.accountAddressSmall : undefined,
              ]}
            >
              ({address})
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.balanceText,
              accountLabelTag ? styles.balanceTextSmall : undefined,
            ]}
          >
            {strings('signature_request.balance_title')}{' '}
            {dollarBalance !== undefined
              ? `${dollarBalance} (${balance})`
              : balance}
          </Text>
        </View>
        {accountLabelTag && (
          <View style={styles.tag}>
            <Text variant={TextVariant.BodySMBold} style={styles.tagText}>
              {accountLabelTag}
            </Text>
          </View>
        )}
      </View>
    );
  }
}

AccountInfoCard.contextType = ThemeContext;

export default connect(mapStateToProps)(AccountInfoCard);
