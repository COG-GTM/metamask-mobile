/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { fontStyles } from '../../../../../../../styles/common';
import { connect } from 'react-redux';
import {
  isBN,
  weiToFiat,
  weiToFiatNumber,
  balanceToFiatNumber,
  renderFromTokenMinimalUnit,
  renderFromWei,
  BNToHex,
  hexToBN,
} from '../../../../../../../util/number';
import { strings } from '../../../../../../../../locales/i18n';
import {
  getTicker,
  getNormalizedTxState,
  calculateAmountsEIP1559,
  calculateEthEIP1559,
  calculateERC20EIP1559,
} from '../../../../../../../util/transactions';
import { sumHexWEIs } from '../../../../../../../util/conversions';
import { MetaMetricsEvents } from '../../../../../../../core/Analytics';
import {
  TESTNET_FAUCETS,
  isTestNet,
  isTestNetworkWithFaucet,
} from '../../../../../../../util/networks';
import CustomNonceModal from '../../../SendFlow/components/CustomNonceModal';
import {
  setNonce,
  setProposedNonce,
} from '../../../../../../../actions/transaction';
import TransactionReviewEIP1559 from '../TransactionReviewEIP1559';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import CustomNonce from '../../CustomNonce';
import Logger from '../../../../../../../util/Logger';
import { ThemeContext, mockTheme } from '../../../../../../../util/theme';
import AppConstants from '../../../../../../../core/AppConstants';
import WarningMessage from '../../../SendFlow/WarningMessage';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../../selectors/currencyRateController';
import { createBrowserNavDetails } from '../../../../../Browser';
import { isNetworkRampNativeTokenSupported } from '../../../../../../../components/UI/Ramp/utils';
import { getRampNetworks } from '../../../../../../../reducers/fiatOrders';
import { createBuyNavigationDetails } from '../../../../../../UI/Ramp/routes/utils';
import { withMetricsAwareness } from '../../../../../../../components/hooks/useMetrics';
import { selectShouldUseSmartTransaction } from '../../../../../../../selectors/smartTransactionsController';
import { getNetworkNonce } from '../../../../../../../util/transaction-controller';
import { selectNativeCurrencyByChainId } from '../../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../../selectors/tokenRatesController';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
  StyleSheet.create({
    overviewAlert: {
      alignItems: 'center',
      backgroundColor: colors.error.muted,
      borderColor: colors.error.default,
      borderRadius: 4,
      borderWidth: 1,
      flexDirection: 'row',
      height: 32,
      paddingHorizontal: 16,
      marginHorizontal: 24,
      marginTop: 12,
    },
    overviewAlertText: {
      ...fontStyles.normal,
      color: colors.text.default,
      flex: 1,
      fontSize: 12,
      marginLeft: 8,
    },
    overviewAlertIcon: {
      color: colors.error.default,
      flex: 0,
    },
    viewDataWrapper: {
      flex: 1,
      marginTop: 16,
    },
    viewDataButton: {
      alignSelf: 'center',
    },
    viewDataText: {
      color: colors.primary.default,
      textAlign: 'center',
      fontSize: 12,
      ...fontStyles.bold,
      alignSelf: 'center',
    },
    errorWrapper: {
      marginHorizontal: 24,
      marginTop: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.error.muted,
      borderColor: colors.error.default,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    error: {
      color: colors.text.default,
      fontSize: 12,
      lineHeight: 16,
      ...fontStyles.normal,
      textAlign: 'center',
    },
    underline: {
      textDecorationLine: 'underline',
      ...fontStyles.bold,
    },
    actionsWrapper: {
      margin: 24,
    },
  });

/**
 * PureComponent that supports reviewing a transaction information
 */
class TransactionReviewInformation extends PureComponent<TransactionReviewInformationProps> {

  state = {
    toFocused: false,
    amountError: '',
    actionKey: strings('transactions.tx_review_confirm'),
    nonceModalVisible: false,
  };

  componentDidMount = async () => {
    const { showCustomNonce } = this.props;
    showCustomNonce && (await this.setNetworkNonce());
  };

  setNetworkNonce = async () => {
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const proposedNonce = await getNetworkNonce(transaction, networkClientId);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    setNonce(proposedNonce);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    setProposedNonce(proposedNonce);
  };

  toggleNonceModal = () =>
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.setState((state) => ({ nonceModalVisible: !state.nonceModalVisible }));

  renderCustomNonceModal = () => {
    const { setNonce } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { proposedNonce, nonce } = this.props.transaction;
    return (
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <CustomNonceModal
        proposedNonce={proposedNonce}
        nonceValue={nonce}
        close={this.toggleNonceModal}
        save={setNonce}
      />
    );
  };

  getTotalFiat = (
    // @ts-expect-error -- legacy JavaScript UI type boundary
    asset,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    totalGas,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    conversionRate,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    exchangeRate,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    currentCurrency,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    amountToken,
  ) => {
    let total = 0;
    const gasFeeFiat = weiToFiatNumber(totalGas, conversionRate);
    const balanceFiat = balanceToFiatNumber(
      parseFloat(amountToken),
      conversionRate,
      exchangeRate,
    );
    const base = Math.pow(10, 5);
    total = ((parseFloat(gasFeeFiat) + parseFloat(balanceFiat)) * base) / base;
    return `${total} ${currentCurrency}`;
  };

  buyEth = () => {
    const { navigation } = this.props;
    /* this is kinda weird, we have to reject the transaction to collapse the modal */
    this.onCancelPress();
    try {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation.navigate(...createBuyNavigationDetails());
    } catch (error) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      Logger.error(error, 'Navigation: Error when navigating to buy ETH.');
    }

    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  };

  edit = () => {
    const { edit } = this.props;
    edit && edit();
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  getRenderTotals = (totalGas, totalGasFiat) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { value, selectedAsset, assetType },
      currentCurrency,
      conversionRate,
      contractExchangeRates,
      ticker,
    } = this.props;

    const totals = {
      ETH: () => {
        const totalEth = isBN(value) ? value.add(totalGas) : totalGas;
        const totalFiat = `${weiToFiat(
          totalEth,
          conversionRate,
          currentCurrency,
        )}`;

        const totalValue = `${renderFromWei(totalEth)} ${getTicker(ticker)}`;

        return [totalFiat, totalValue];
      },
      ERC20: () => {
        const amountToken = renderFromTokenMinimalUnit(
          value,
          selectedAsset.decimals,
        );
        const conversionRateAsset =
          // @ts-expect-error -- legacy JavaScript UI type boundary
          contractExchangeRates[selectedAsset.address];
        const totalFiat = this.getTotalFiat(
          selectedAsset,
          totalGas,
          conversionRate,
          conversionRateAsset,
          currentCurrency,
          amountToken,
        );
        const totalValue = `${
          amountToken + ' ' + selectedAsset.symbol
        } + ${renderFromWei(totalGas)} ${getTicker(ticker)}`;
        return [totalFiat, totalValue];
      },
      ERC721: () => {
        const totalFiat = totalGasFiat;
        const totalValue = `${selectedAsset.name}  (#${
          selectedAsset.tokenId
        }) + ${renderFromWei(totalGas)} ${getTicker(ticker)}`;
        return [totalFiat, totalValue];
      },
      default: () => [undefined, undefined],
    };
    // @ts-expect-error -- legacy JavaScript UI type boundary
    return totals[assetType] || totals.default;
  };

  isTestNetwork = () => {
    const { chainId } = this.props;
    return isTestNet(chainId);
  };

  getRenderTotalsEIP1559 = ({
    // @ts-expect-error -- legacy JavaScript UI type boundary
    gasFeeMinNative,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    gasFeeMinConversion,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    gasFeeMaxNative,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    gasFeeMaxConversion,
  }) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { value, selectedAsset, assetType },
      currentCurrency,
      conversionRate,
      contractExchangeRates,
      ticker,
    } = this.props;

    let renderableTotalMinNative,
      renderableTotalMinConversion,
      renderableTotalMaxNative,
      renderableTotalMaxConversion;

    const totals = {
      ETH: () => {
        const {
          totalMinNative,
          totalMinConversion,
          totalMaxNative,
          totalMaxConversion,
        } = calculateAmountsEIP1559({
          value: value && BNToHex(value),
          nativeCurrency: ticker,
          currentCurrency,
          conversionRate,
          gasFeeMinConversion,
          gasFeeMinNative,
          gasFeeMaxNative,
          gasFeeMaxConversion,
        });

        [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ] = calculateEthEIP1559({
          nativeCurrency: ticker,
          currentCurrency,
          totalMinNative,
          totalMinConversion,
          totalMaxNative,
          totalMaxConversion,
        });

        return [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ];
      },
      ERC20: () => {
        const {
          totalMinNative,
          totalMinConversion,
          totalMaxNative,
          totalMaxConversion,
        } = calculateAmountsEIP1559({
          value: '0x0',
          nativeCurrency: ticker,
          currentCurrency,
          conversionRate,
          gasFeeMinConversion,
          gasFeeMinNative,
          gasFeeMaxNative,
          gasFeeMaxConversion,
        });

        const tokenAmount = renderFromTokenMinimalUnit(
          value,
          selectedAsset.decimals,
        );
        // @ts-expect-error -- legacy JavaScript UI type boundary
        const exchangeRate = contractExchangeRates[selectedAsset.address];
        const symbol = selectedAsset.symbol;

        [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ] = calculateERC20EIP1559({
          currentCurrency,
          nativeCurrency: ticker,
          conversionRate,
          exchangeRate,
          tokenAmount,
          totalMinConversion,
          totalMaxConversion,
          symbol,
          totalMinNative,
          totalMaxNative,
        });
        return [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ];
      },
      ERC721: () => {
        const {
          totalMinNative,
          totalMinConversion,
          totalMaxNative,
          totalMaxConversion,
        } = calculateAmountsEIP1559({
          value: '0x0',
          nativeCurrency: ticker,
          currentCurrency,
          conversionRate,
          gasFeeMinConversion,
          gasFeeMinNative,
          gasFeeMaxNative,
          gasFeeMaxConversion,
        });

        [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ] = calculateEthEIP1559({
          nativeCurrency: ticker,
          currentCurrency,
          totalMinNative,
          totalMinConversion,
          totalMaxNative,
          totalMaxConversion,
        });

        renderableTotalMinNative = `${selectedAsset.name} ${
          ' (#' + selectedAsset.tokenId + ')'
        } + ${renderableTotalMinNative}`;

        renderableTotalMaxNative = `${selectedAsset.name} ${
          ' (#' + selectedAsset.tokenId + ')'
        } + ${renderableTotalMaxNative}`;

        return [
          renderableTotalMinNative,
          renderableTotalMinConversion,
          renderableTotalMaxNative,
          renderableTotalMaxConversion,
        ];
      },
      default: () => [undefined, undefined],
    };
    // @ts-expect-error -- legacy JavaScript UI type boundary
    return totals[assetType] || totals.default;
  };

  onCancelPress = () => {
    const { onCancelPress } = this.props;
    onCancelPress && onCancelPress();
  };

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.onCancelPress();
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.navigation.navigate(
        ...createBrowserNavDetails({
          // @ts-expect-error -- legacy JavaScript UI type boundary
          newTabUrl: TESTNET_FAUCETS[chainId],
          timestamp: Date.now(),
        }),
      );
    });
  };

  renderTransactionReviewEIP1559 = () => {
    const {
      EIP1559GasData,
      primaryCurrency,
      origin,
      originWarning,
      onUpdatingValuesStart,
      onUpdatingValuesEnd,
      animateOnChange,
      isAnimating,
      ready,
      chainId,
    } = this.props;
    let host;
    if (origin) {
      host = new URL(origin).hostname;
    }
    const [
      renderableTotalMinNative,
      renderableTotalMinConversion,
      renderableTotalMaxNative,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    ] = this.getRenderTotalsEIP1559(EIP1559GasData)();
    return (
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <TransactionReviewEIP1559
        // @ts-expect-error -- legacy JavaScript UI type boundary
        totalNative={renderableTotalMinNative}
        totalConversion={renderableTotalMinConversion}
        totalMaxNative={renderableTotalMaxNative}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        gasFeeNative={EIP1559GasData.renderableGasFeeMinNative}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        gasFeeConversion={EIP1559GasData.renderableGasFeeMinConversion}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        gasFeeMaxNative={EIP1559GasData.renderableGasFeeMaxNative}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        gasFeeMaxConversion={EIP1559GasData.renderableGasFeeMaxConversion}
        primaryCurrency={primaryCurrency}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        timeEstimate={EIP1559GasData.timeEstimate}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        timeEstimateColor={EIP1559GasData.timeEstimateColor}
        // @ts-expect-error -- legacy JavaScript UI type boundary
        timeEstimateId={EIP1559GasData.timeEstimateId}
        onEdit={this.edit}
        origin={host}
        originWarning={originWarning}
        onUpdatingValuesStart={onUpdatingValuesStart}
        onUpdatingValuesEnd={onUpdatingValuesEnd}
        animateOnChange={animateOnChange}
        isAnimating={isAnimating}
        gasEstimationReady={ready}
        chainId={chainId}
      />
    );
  };

  renderTransactionReviewLegacy = () => {
    const {
      primaryCurrency,
      ready,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { gas, gasPrice },
      currentCurrency,
      conversionRate,
      ticker,
      over,
      onUpdatingValuesStart,
      onUpdatingValuesEnd,
      animateOnChange,
      isAnimating,
      multiLayerL1FeeTotal,
      chainId,
    } = this.props;

    let totalGas =
      isBN(gas) && isBN(gasPrice) ? gas.mul(gasPrice) : hexToBN('0x0');
    if (multiLayerL1FeeTotal) {
      totalGas = hexToBN(sumHexWEIs([BNToHex(totalGas), multiLayerL1FeeTotal]));
    }

    const totalGasFiat = weiToFiat(totalGas, conversionRate, currentCurrency);
    const totalGasEth = `${renderFromWei(totalGas)} ${getTicker(ticker)}`;
    const [totalFiat, totalValue] = this.getRenderTotals(
      totalGas,
      totalGasFiat,
    )();
    return (
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <TransactionReviewEIP1559
        // @ts-expect-error -- legacy JavaScript UI type boundary
        totalNative={totalValue}
        totalConversion={totalFiat}
        gasFeeNative={totalGasEth}
        gasFeeConversion={totalGasFiat}
        primaryCurrency={primaryCurrency}
        onEdit={() => this.edit()}
        over={over}
        onUpdatingValuesStart={onUpdatingValuesStart}
        onUpdatingValuesEnd={onUpdatingValuesEnd}
        animateOnChange={animateOnChange}
        isAnimating={isAnimating}
        gasEstimationReady={ready}
        legacy
        chainId={chainId}
      />
    );
  };

  render() {
    const { amountError, nonceModalVisible } = this.state;
    const {
      chainId,
      toggleDataView,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { warningGasPriceHigh, type },
      error,
      over,
      showCustomNonce,
      gasEstimateType,
      gasSelected,
      isNativeTokenBuySupported,
      shouldUseSmartTransaction,
    } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { nonce } = this.props.transaction;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const errorPress = this.isTestNetwork() ? this.goToFaucet : this.buyEth;
    const errorLinkText = this.isTestNetwork()
      ? strings('transaction.go_to_faucet')
      : strings('transaction.token_marketplace');

    const showFeeMarket =
      (!gasEstimateType ||
        gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
        gasEstimateType === GAS_ESTIMATE_TYPES.NONE) &&
      type !== '0x0';

    return (
      <React.Fragment>
        {nonceModalVisible && this.renderCustomNonceModal()}
        {showFeeMarket
          ? this.renderTransactionReviewEIP1559()
          : this.renderTransactionReviewLegacy()}
        {gasSelected === AppConstants.GAS_OPTIONS.LOW && (
          <WarningMessage
            style={styles.actionsWrapper}
            warningMessage={strings('edit_gas_fee_eip1559.low_fee_warning')}
          />
        )}
        {showCustomNonce && !shouldUseSmartTransaction && (
          // @ts-expect-error -- legacy JavaScript UI type boundary
          <CustomNonce nonce={nonce} onNonceEdit={this.toggleNonceModal} />
        )}
        {!!amountError && (
          <View style={styles.overviewAlert}>
            <MaterialIcon
              name={'error'}
              size={20}
              style={styles.overviewAlertIcon}
            />
            <Text style={styles.overviewAlertText}>
              {strings('transaction.alert')}: {amountError}.
            </Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorWrapper}>
            {isTestNetworkWithFaucet(chainId) || isNativeTokenBuySupported ? (
              <TouchableOpacity onPress={errorPress}>
                <Text style={styles.error}>{error}</Text>
                {over && (
                  <Text style={[styles.error, styles.underline]}>
                    {errorLinkText}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.error}>{error}</Text>
            )}
          </View>
        )}
        {!!warningGasPriceHigh && (
          <View style={styles.errorWrapper}>
            <Text style={styles.error}>{warningGasPriceHigh}</Text>
          </View>
        )}
        {!over && !showCustomNonce && (
          <View style={styles.viewDataWrapper}>
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={toggleDataView}
            >
              <Text style={styles.viewDataText}>
                {strings('transaction.view_data')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </React.Fragment>
    );
  }
}

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;
  const networkClientId = transaction?.networkClientId;

  return {
    chainId,
    networkClientId,
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    contractExchangeRates: selectContractExchangeRatesByChainId(state, chainId),
    transaction,
    ticker: selectNativeCurrencyByChainId(state, chainId),
    primaryCurrency: state.settings.primaryCurrency,
    showCustomNonce: state.settings.showCustomNonce,
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      chainId,
      getRampNetworks(state),
    ),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
  };
};

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setNonce: (nonce) => dispatch(setNonce(nonce)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setProposedNonce: (nonce) => dispatch(setProposedNonce(nonce)),
});

TransactionReviewInformation.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error -- legacy JavaScript UI type boundary
)(withMetricsAwareness(TransactionReviewInformation));

interface TransactionReviewInformationProps {
  EIP1559GasData?: Record<string, any>;
  animateOnChange?: boolean;
  chainId?: string;
  contractExchangeRates?: Record<string, any>;
  conversionRate?: number;
  currentCurrency?: string;
  edit?: (...args: any[]) => any;
  error?: string;
  gasEstimateType?: string;
  gasSelected?: string;
  isAnimating?: boolean;
  isNativeTokenBuySupported?: boolean;
  metrics?: Record<string, any>;
  multiLayerL1FeeTotal?: string;
  navigation?: Record<string, any>;
  networkClientId?: string;
  onCancelPress?: (...args: any[]) => any;
  onUpdatingValuesEnd?: (...args: any[]) => any;
  onUpdatingValuesStart?: (...args: any[]) => any;
  origin?: string;
  originWarning?: boolean;
  over?: boolean;
  primaryCurrency?: string;
  ready?: boolean;
  setNonce?: (...args: any[]) => any;
  setProposedNonce?: (...args: any[]) => any;
  shouldUseSmartTransaction?: boolean;
  showCustomNonce?: boolean;
  ticker?: string;
  toggleDataView?: (...args: any[]) => any;
  transaction?: Record<string, any>;
}
type Props = TransactionReviewInformationProps;
