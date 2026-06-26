import React, { PureComponent } from 'react';
import BN from 'bnjs4';
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
  setNonce as setNonceAction,
  setProposedNonce as setProposedNonceAction,
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
import { Colors, Theme } from '../../../../../../../util/theme/models';
import { IUseMetricsHook } from '../../../../../../hooks/useMetrics/useMetrics.types';
import { RootState } from '../../../../../../../reducers';

interface SelectedAsset {
  address?: string;
  symbol?: string;
  decimals?: number;
  name?: string;
  tokenId?: string;
}

interface ReviewTransaction {
  value?: BN;
  selectedAsset?: SelectedAsset;
  assetType?: string;
  gas?: BN;
  gasPrice?: BN;
  warningGasPriceHigh?: string;
  type?: string;
  nonce?: number;
  proposedNonce?: number;
}

export interface EIP1559GasDataType {
  renderableGasFeeMinNative?: string;
  renderableGasFeeMinConversion?: string;
  renderableGasFeeMaxNative?: string;
  renderableGasFeeMaxConversion?: string;
  timeEstimate?: string;
  timeEstimateColor?: string;
  timeEstimateId?: string;
  gasFeeMinNative?: string;
  gasFeeMinConversion?: string;
  gasFeeMaxNative?: string;
  gasFeeMaxConversion?: string;
}

interface TransactionReviewInformationProps {
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency?: string;
  /**
   * Transaction object associated with this transaction
   */
  transaction: ReviewTransaction;
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  contractExchangeRates?: Record<string, number>;
  /**
   * Callback for transaction edition
   */
  edit?: () => void;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * Hides or shows transaction data
   */
  toggleDataView?: () => void;
  /**
   * Whether or not basic gas estimates have been fetched
   */
  ready?: boolean;
  /**
   * Transaction error
   */
  error?: string | boolean;
  /**
   * True if transaction is over the available funds
   */
  over?: boolean;
  /**
   * Object that represents the navigator
   */
  navigation?: {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate: (...args: any[]) => void;
  };
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress?: () => void;
  /**
   * The chain ID for the current selected network
   */
  chainId?: string;
  /**
   * ID of the global network client
   */
  networkClientId?: string;
  /**
   * Indicates whether custom nonce should be shown in transaction editor
   */
  showCustomNonce?: boolean;
  /**
   * Set transaction nonce
   */
  setNonce?: (nonce: number) => void;
  /**
   * Set proposed nonce (from network)
   */
  setProposedNonce?: (nonce: number) => void;
  gasEstimateType?: string;
  EIP1559GasData?: EIP1559GasDataType;
  origin?: string;
  /**
   * Function to call when update animation starts
   */
  onUpdatingValuesStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onUpdatingValuesEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
  /**
   * Boolean to determine if the animation is happening
   */
  isAnimating?: boolean;
  /**
   * If it's a eip1559 network and dapp suggest legact gas then it should show a warning
   */
  originWarning?: boolean;
  gasSelected?: string;
  multiLayerL1FeeTotal?: string;
  /**
   * Boolean that indicates if the network supports buy
   */
  isNativeTokenBuySupported?: boolean;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
}

interface TransactionReviewInformationState {
  toFocused: boolean;
  amountError: string;
  actionKey: string;
  nonceModalVisible: boolean;
}

const createStyles = (colors: Colors) =>
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
class TransactionReviewInformation extends PureComponent<
  TransactionReviewInformationProps,
  TransactionReviewInformationState
> {
  state: TransactionReviewInformationState = {
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
    const proposedNonce = await getNetworkNonce(
      transaction as { from: string },
      networkClientId as string,
    );
    setNonce?.(proposedNonce);
    setProposedNonce?.(proposedNonce);
  };

  toggleNonceModal = () =>
    this.setState((state) => ({ nonceModalVisible: !state.nonceModalVisible }));

  renderCustomNonceModal = () => {
    const { setNonce } = this.props;
    const { proposedNonce, nonce } = this.props.transaction;
    return (
      <CustomNonceModal
        proposedNonce={proposedNonce as number}
        nonceValue={nonce as number}
        close={this.toggleNonceModal}
        save={setNonce as (nonce: number) => void}
      />
    );
  };

  getTotalFiat = (
    _asset: SelectedAsset | undefined,
    totalGas: BN,
    conversionRate: number | undefined,
    exchangeRate: number | undefined,
    currentCurrency: string | undefined,
    amountToken: string,
  ) => {
    let total = 0;
    const gasFeeFiat = weiToFiatNumber(totalGas, conversionRate as number);
    const balanceFiat = balanceToFiatNumber(
      parseFloat(amountToken),
      conversionRate as number,
      exchangeRate as number,
    );
    const base = Math.pow(10, 5);
    total =
      ((parseFloat(String(gasFeeFiat)) + parseFloat(String(balanceFiat))) *
        base) /
      base;
    return `${total} ${currentCurrency}`;
  };

  buyEth = () => {
    const { navigation } = this.props;
    /* this is kinda weird, we have to reject the transaction to collapse the modal */
    this.onCancelPress();
    try {
      navigation?.navigate(...createBuyNavigationDetails());
    } catch (error) {
      Logger.error(
        error as Error,
        'Navigation: Error when navigating to buy ETH.',
      );
    }

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  };

  edit = () => {
    const { edit } = this.props;
    edit && edit();
  };

  getRenderTotals = (totalGas: BN, totalGasFiat: string) => {
    const {
      transaction: { value, selectedAsset, assetType },
      currentCurrency,
      conversionRate,
      contractExchangeRates,
      ticker,
    } = this.props;

    const totals = {
      ETH: () => {
        const totalEth = isBN(value as BN)
          ? (value as BN).add(totalGas)
          : totalGas;
        const totalFiat = `${weiToFiat(
          totalEth,
          conversionRate,
          currentCurrency as string,
        )}`;

        const totalValue = `${renderFromWei(totalEth)} ${getTicker(ticker)}`;

        return [totalFiat, totalValue];
      },
      ERC20: () => {
        const amountToken = renderFromTokenMinimalUnit(
          value as BN,
          selectedAsset?.decimals as number,
        );
        const conversionRateAsset =
          contractExchangeRates?.[selectedAsset?.address as string];
        const totalFiat = this.getTotalFiat(
          selectedAsset,
          totalGas,
          conversionRate,
          conversionRateAsset,
          currentCurrency,
          amountToken,
        );
        const totalValue = `${
          amountToken + ' ' + selectedAsset?.symbol
        } + ${renderFromWei(totalGas)} ${getTicker(ticker)}`;
        return [totalFiat, totalValue];
      },
      ERC721: () => {
        const totalFiat = totalGasFiat;
        const totalValue = `${selectedAsset?.name}  (#${
          selectedAsset?.tokenId
        }) + ${renderFromWei(totalGas)} ${getTicker(ticker)}`;
        return [totalFiat, totalValue];
      },
      default: () => [undefined, undefined],
    };
    return totals[assetType as keyof typeof totals] || totals.default;
  };

  isTestNetwork = () => {
    const { chainId } = this.props;
    return isTestNet(chainId as string);
  };

  getRenderTotalsEIP1559 = ({
    gasFeeMinNative,
    gasFeeMinConversion,
    gasFeeMaxNative,
    gasFeeMaxConversion,
  }: EIP1559GasDataType) => {
    const {
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
        } as Parameters<typeof calculateAmountsEIP1559>[0]);

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
        } as Parameters<typeof calculateAmountsEIP1559>[0]);

        const tokenAmount = renderFromTokenMinimalUnit(
          value as BN,
          selectedAsset?.decimals as number,
        );
        const exchangeRate =
          contractExchangeRates?.[selectedAsset?.address as string];
        const symbol = selectedAsset?.symbol;

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
        } as Parameters<typeof calculateAmountsEIP1559>[0]);

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

        renderableTotalMinNative = `${selectedAsset?.name} ${
          ' (#' + selectedAsset?.tokenId + ')'
        } + ${renderableTotalMinNative}`;

        renderableTotalMaxNative = `${selectedAsset?.name} ${
          ' (#' + selectedAsset?.tokenId + ')'
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
    return totals[assetType as keyof typeof totals] || totals.default;
  };

  onCancelPress = () => {
    const { onCancelPress } = this.props;
    onCancelPress && onCancelPress();
  };

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.onCancelPress();
      this.props.navigation?.navigate(
        ...createBrowserNavDetails({
          newTabUrl: TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS],
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
    ] = this.getRenderTotalsEIP1559(EIP1559GasData as EIP1559GasDataType)();
    return (
      <TransactionReviewEIP1559
        totalNative={renderableTotalMinNative}
        totalConversion={renderableTotalMinConversion}
        totalMaxNative={renderableTotalMaxNative}
        gasFeeNative={EIP1559GasData?.renderableGasFeeMinNative}
        gasFeeConversion={EIP1559GasData?.renderableGasFeeMinConversion}
        gasFeeMaxNative={EIP1559GasData?.renderableGasFeeMaxNative}
        gasFeeMaxConversion={EIP1559GasData?.renderableGasFeeMaxConversion}
        primaryCurrency={primaryCurrency}
        timeEstimate={EIP1559GasData?.timeEstimate}
        timeEstimateColor={EIP1559GasData?.timeEstimateColor}
        timeEstimateId={EIP1559GasData?.timeEstimateId}
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
      isBN(gas as BN) && isBN(gasPrice as BN)
        ? (gas as BN).mul(gasPrice as BN)
        : hexToBN('0x0');
    if (multiLayerL1FeeTotal) {
      totalGas = hexToBN(sumHexWEIs([BNToHex(totalGas), multiLayerL1FeeTotal]));
    }

    const totalGasFiat = weiToFiat(
      totalGas,
      conversionRate,
      currentCurrency as string,
    );
    const totalGasEth = `${renderFromWei(totalGas)} ${getTicker(ticker)}`;
    const [totalFiat, totalValue] = this.getRenderTotals(
      totalGas,
      totalGasFiat,
    )();
    return (
      <TransactionReviewEIP1559
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
      transaction: { warningGasPriceHigh, type },
      error,
      over,
      showCustomNonce,
      gasEstimateType,
      gasSelected,
      isNativeTokenBuySupported,
      shouldUseSmartTransaction,
    } = this.props;
    const { nonce } = this.props.transaction;
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
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

const mapStateToProps = (state: RootState) => {
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  setNonce: (nonce: number) => dispatch(setNonceAction(nonce)),
  setProposedNonce: (nonce: number) => dispatch(setProposedNonceAction(nonce)),
});

TransactionReviewInformation.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    TransactionReviewInformation as unknown as Parameters<
      typeof withMetricsAwareness
    >[0],
  ),
);
