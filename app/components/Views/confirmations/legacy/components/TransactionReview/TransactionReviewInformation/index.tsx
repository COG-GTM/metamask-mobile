import React, { PureComponent } from 'react';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Dispatch } from 'redux';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type BN from 'bnjs4';
import type { Hex } from '@metamask/utils';
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
  renderFromWei,
  BNToHex,
  hexToBN,
} from '../../../../../../../util/number';
import { strings } from '../../../../../../../../locales/i18n';
import {
  getTicker,
  getNormalizedTxState,
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
import { Colors, Theme } from '../../../../../../../util/theme/models';
import { RootState } from '../../../../../../../reducers';
import { TransactionState } from '../../../../../../../reducers/transaction';
import { TxMeta } from '../../../../../../../util/transaction-reducer-helpers';
import { GasTransactionProps } from '../../../../../../../core/GasPolling/types';
import { IWithMetricsAwarenessProps } from '../../../../../../hooks/useMetrics/withMetricsAwareness.types';
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

export type NormalizedTransaction = TransactionState &
  Partial<TxMeta> & {
    networkClientId?: string;
  };

export type EIP1559GasData = Partial<GasTransactionProps>;

export interface TransactionReviewInformationOwnProps {
  /**
   * Callback for transaction edition
   */
  edit?: () => void;
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
  navigation: NavigationProp<ParamListBase>;
  /**
   * Called when the cancel button is clicked
   */
  onCancelPress?: () => void;
  gasEstimateType?: string;
  EIP1559GasData?: EIP1559GasData;
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
}

interface TransactionReviewInformationStateProps {
  /**
   * The chain ID for the current selected network
   */
  chainId?: string;
  /**
   * ID of the global network client
   */
  networkClientId?: string;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate?: number | null;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency?: string;
  /**
   * Transaction object associated with this transaction
   */
  transaction: NormalizedTransaction;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency: string;
  /**
   * Indicates whether custom nonce should be shown in transaction editor
   */
  showCustomNonce?: boolean;
  /**
   * Boolean that indicates if the network supports buy
   */
  isNativeTokenBuySupported: boolean;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction: boolean;
}

interface TransactionReviewInformationDispatchProps {
  /**
   * Set transaction nonce
   */
  setNonce: (nonce: number) => void;
  /**
   * Set proposed nonce (from network)
   */
  setProposedNonce: (nonce: number) => void;
}

export type TransactionReviewInformationProps =
  TransactionReviewInformationOwnProps &
    TransactionReviewInformationStateProps &
    TransactionReviewInformationDispatchProps &
    IWithMetricsAwarenessProps;

interface TransactionReviewInformationState {
  toFocused: boolean;
  amountError: string;
  actionKey: string;
  nonceModalVisible: boolean;
}

/**
 * PureComponent that supports reviewing a transaction information
 */
class TransactionReviewInformation extends PureComponent<
  TransactionReviewInformationProps,
  TransactionReviewInformationState
> {
  static contextType = ThemeContext;

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
    if (!transaction.from || !networkClientId) return;
    const proposedNonce = await getNetworkNonce(
      { from: transaction.from },
      networkClientId,
    );
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
  };

  toggleNonceModal = () =>
    this.setState((state) => ({ nonceModalVisible: !state.nonceModalVisible }));

  renderCustomNonceModal = () => {
    const { setNonce } = this.props;
    const { proposedNonce, nonce } = this.props.transaction;
    if (proposedNonce === undefined || nonce === undefined) return null;
    return (
      <CustomNonceModal
        proposedNonce={proposedNonce}
        nonceValue={nonce}
        close={this.toggleNonceModal}
        save={setNonce}
      />
    );
  };

  buyEth = () => {
    const { navigation } = this.props;
    /* this is kinda weird, we have to reject the transaction to collapse the modal */
    this.onCancelPress();
    try {
      navigation.navigate(...createBuyNavigationDetails());
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

  isTestNetwork = () => {
    const { chainId } = this.props;
    return isTestNet(chainId ?? '');
  };

  onCancelPress = () => {
    const { onCancelPress } = this.props;
    onCancelPress && onCancelPress();
  };

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.onCancelPress();
      this.props.navigation.navigate(
        ...createBrowserNavDetails({
          newTabUrl: chainId
            ? TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS]
            : undefined,
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
    let host: string | undefined;
    if (origin) {
      host = new URL(origin).hostname;
    }
    const gasData: EIP1559GasData = EIP1559GasData ?? {};
    return (
      <TransactionReviewEIP1559
        gasFeeNative={gasData.renderableGasFeeMinNative}
        gasFeeConversion={gasData.renderableGasFeeMinConversion}
        gasFeeMaxNative={gasData.renderableGasFeeMaxNative}
        gasFeeMaxConversion={gasData.renderableGasFeeMaxConversion}
        primaryCurrency={primaryCurrency}
        timeEstimate={gasData.timeEstimate}
        timeEstimateColor={gasData.timeEstimateColor}
        timeEstimateId={gasData.timeEstimateId}
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
      onUpdatingValuesStart,
      onUpdatingValuesEnd,
      animateOnChange,
      isAnimating,
      multiLayerL1FeeTotal,
      chainId,
    } = this.props;

    let totalGas: BN =
      gas && gasPrice && isBN(gas) && isBN(gasPrice)
        ? gas.mul(gasPrice)
        : hexToBN('0x0');
    if (multiLayerL1FeeTotal) {
      totalGas = hexToBN(sumHexWEIs([BNToHex(totalGas), multiLayerL1FeeTotal]));
    }

    const totalGasFiat = weiToFiat(
      totalGas,
      conversionRate ?? null,
      currentCurrency ?? '',
    );
    const totalGasEth = `${renderFromWei(totalGas)} ${getTicker(ticker ?? '')}`;
    return (
      <TransactionReviewEIP1559
        gasFeeNative={totalGasEth}
        gasFeeConversion={totalGasFiat}
        primaryCurrency={primaryCurrency}
        onEdit={() => this.edit()}
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
    const colors =
      (this.context as Theme | undefined)?.colors || mockTheme.colors;
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

const mapStateToProps = (
  state: RootState,
): TransactionReviewInformationStateProps => {
  const transaction: NormalizedTransaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId as Hex | undefined;
  const networkClientId = transaction?.networkClientId;

  return {
    chainId,
    networkClientId,
    conversionRate: selectConversionRateByChainId(state, chainId ?? ''),
    currentCurrency: selectCurrentCurrency(state),
    transaction,
    ticker: selectNativeCurrencyByChainId(state, chainId ?? ''),
    primaryCurrency: state.settings.primaryCurrency,
    showCustomNonce: state.settings.showCustomNonce,
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      chainId ?? '',
      getRampNetworks(state),
    ),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
  };
};

const mapDispatchToProps = (
  dispatch: Dispatch,
): TransactionReviewInformationDispatchProps => ({
  setNonce: (nonce: number) => dispatch(setNonceAction(nonce)),
  setProposedNonce: (nonce: number) => dispatch(setProposedNonceAction(nonce)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(TransactionReviewInformation));
