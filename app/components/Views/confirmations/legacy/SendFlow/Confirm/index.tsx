import React, { PureComponent, ReactNode } from 'react';
import { Dispatch } from 'redux';
import {
  BNToHex,
  fromWei,
  renderFromWei,
  renderFromTokenMinimalUnit,
  weiToFiat,
  balanceToFiat,
  isDecimal,
  hexToBN,
} from '../../../../../../util/number';
import {
  InteractionManager,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { type RootState } from '../../../../../../reducers';
import { getSendFlowTitle } from '../../../../../UI/Navbar';
// @ts-expect-error - No type definitions available
import Eth from '@metamask/ethjs-query';
import {
  getTicker,
  decodeTransferData,
  getNormalizedTxState,
} from '../../../../../../util/transactions';
import StyledButton from '../../../../../UI/StyledButton';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import {
  prepareTransaction,
  resetTransaction,
  setNonce,
  setProposedNonce,
  setTransactionId,
  setTransactionValue,
} from '../../../../../../actions/transaction';
import Engine from '../../../../../../core/Engine';
import Logger from '../../../../../../util/Logger';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import NotificationManager from '../../../../../../core/NotificationManager';
import { strings } from '../../../../../../../locales/i18n';
import Modal from 'react-native-modal';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import {
  isMultiLayerFeeNetwork,
  getDecimalChainId,
} from '../../../../../../util/networks';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../../../util/networks/engineNetworkUtils';
import Text from '../../../../../Base/Text';
import { removeFavoriteCollectible } from '../../../../../../actions/collectibles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountFromToInfoCard from '../../../../../UI/AccountFromToInfoCard';
import TransactionReview from '../../components/TransactionReview/TransactionReviewEIP1559Update';
import CustomNonce from '../../components/CustomNonce';
import AppConstants from '../../../../../../core/AppConstants';
import {
  getAddressAccountType,
  isQRHardwareAccount,
  isHardwareAccount,
} from '../../../../../../util/address';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Theme } from '@metamask/design-tokens';
import WarningMessage from '../WarningMessage';
import { showAlert } from '../../../../../../actions/alert';
import {
  TransactionParams,
} from '@metamask/transaction-controller';
import ClipboardManager from '../../../../../../core/ClipboardManager';
import GlobalAlert from '../../../../../UI/GlobalAlert';
import createStyles from './styles';
import {
  stopGasPolling,
} from '../../../../../../core/GasPolling/GasPolling';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../selectors/currencyRateController';

import { selectAccounts } from '../../../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../../../selectors/tokenBalancesController';
import { selectContractExchangeRates } from '../../../../../../selectors/tokenRatesController';
import { ConfirmViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/ConfirmView.selectors';
import { getDeviceId } from '../../../../../../core/Ledger/Ledger';
import ppomUtil from '../../../../../../lib/ppom/ppom-util';
import {
  selectEvmChainId,
  selectNetworkClientId,
  selectProviderTypeByChainId,
  selectNativeCurrencyByChainId,
} from '../../../../../../selectors/networkController';
import {
  selectGasFeeControllerEstimateType,
} from '../../../../../../selectors/gasFeeController';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { selectGasFeeEstimates } from '../../../../../../selectors/confirmTransaction';
import { isNetworkRampNativeTokenSupported } from '../../../../../../components/UI/Ramp/utils';
import { getRampNetworks } from '../../../../../../reducers/fiatOrders';
import { getNetworkNonce } from '../../../../../../util/transaction-controller';
const isNativeToken = (asset: SelectedAsset): boolean =>
  !asset.address || asset.address === '0x0';
import { withMetricsAwareness } from '../../../../../hooks/useMetrics';

const REVIEW = 'review';
const EDIT = 'edit';

let intervalIdForEstimatedL1Fee: NodeJS.Timeout;

interface SelectedAsset {
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
  tokenId?: string;
}

interface TransactionObject {
  from?: string;
  to?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  chainId?: string;
}

interface TransactionState {
  selectedAsset: SelectedAsset;
  assetType?: string;
  transaction: TransactionObject;
  transactionTo?: string;
  transactionValue?: string;
  paymentRequest?: boolean;
  maxValueMode?: boolean;
}

interface Transaction {
  id?: string;
  chainId?: string;
  networkClientId?: string;
  origin?: string;
  transaction: TransactionObject;
}

interface GasFeeEstimates {
  low?: {
    suggestedMaxFeePerGas?: string;
    suggestedMaxPriorityFeePerGas?: string;
  };
  medium?: {
    suggestedMaxFeePerGas?: string;
    suggestedMaxPriorityFeePerGas?: string;
  };
  high?: {
    suggestedMaxFeePerGas?: string;
    suggestedMaxPriorityFeePerGas?: string;
  };
  estimatedBaseFee?: string;
  gasPrice?: string;
}

interface NavigationProp {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  setOptions: (options: Record<string, unknown>) => void;
  goBack: () => void;
}

interface RouteProp {
  params?: Record<string, unknown>;
  name?: string;
}

interface Accounts {
  [address: string]: {
    balance: string;
  };
}

interface ContractBalances {
  [address: string]: string;
}

interface ContractExchangeRates {
  [address: string]: number;
}

interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  description?: string;
}

interface ConfirmationMetrics {
  [id: string]: Record<string, unknown>;
}

interface TransactionMetadata {
  id?: string;
  status?: string;
  time?: number;
}

interface ConfirmProps {
  navigation: NavigationProp;
  route: RouteProp;
  accounts: Accounts;
  contractBalances: ContractBalances;
  ticker: string;
  transactionState: TransactionState;
  transaction: Transaction;
  conversionRate: number | null | undefined;
  currentCurrency: string;
  contractExchangeRates: ContractExchangeRates;
  prepareTransaction: (transaction: TransactionObject) => void;
  chainId: string;
  networkClientId: string;
  globalNetworkClientId: string;
  showHexData: boolean;
  showCustomNonce: boolean;
  providerType: string;
  selectedAsset: SelectedAsset;
  resetTransaction: () => void;
  primaryCurrency: string;
  setNonce: (nonce: string) => void;
  setProposedNonce: (nonce: string) => void;
  gasFeeEstimates: GasFeeEstimates;
  gasEstimateType: string;
  isPaymentRequest: boolean;
  showAlert: (config: Record<string, unknown>) => void;
  isNativeTokenBuySupported: boolean;
  metrics: {
    trackEvent: (event: unknown, params: Record<string, unknown>) => void;
  };
  setTransactionId: (transactionId: string) => void;
  shouldUseSmartTransaction: boolean;
  confirmationMetricsById: ConfirmationMetrics;
  transactionMetadata: TransactionMetadata;
  updateConfirmationMetric: (params: { id: string; params: Record<string, unknown> }) => void;
  securityAlertResponse: SecurityAlertResponse;
  maxValueMode: boolean;
  setTransactionValue: (value: string) => void;
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: Record<string, unknown>) => void;
}

interface EIP1559GasTransaction {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
}

interface LegacyGasTransaction {
  suggestedGasPrice?: string;
}

interface ConfirmState {
  gasEstimationReady: boolean;
  fromSelectedAddress: string;
  hexDataModalVisible: boolean;
  warningGasPriceHigh: string | undefined;
  ready: boolean;
  transactionValue: string | undefined;
  transactionValueFiat: string | undefined;
  errorMessage: string | undefined;
  mode: string;
  gasSelected: string;
  stopUpdateGas: boolean;
  advancedGasInserted: boolean;
  EIP1559GasTransaction: EIP1559GasTransaction;
  EIP1559GasObject: EIP1559GasTransaction;
  legacyGasObject: LegacyGasTransaction;
  legacyGasTransaction: LegacyGasTransaction;
  multiLayerL1FeeTotal: string;
  result: Record<string, unknown>;
  transactionMeta: Record<string, unknown>;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  pollToken?: string;
  proposedNonce?: string;
  previousContractBalance?: string;
  gasEstimateType?: string;
  gas?: string;
  value?: string;
  actionKey?: string;
  transactionHandled?: boolean;
  transactionTo?: string;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class Confirm extends PureComponent<ConfirmProps, ConfirmState> {
  static contextType = ThemeContext;

  state: ConfirmState = {
    gasEstimationReady: false,
    fromSelectedAddress: this.props.transactionState.transaction.from || '',
    hexDataModalVisible: false,
    warningGasPriceHigh: undefined,
    ready: false,
    transactionValue: undefined,
    transactionValueFiat: undefined,
    errorMessage: undefined,
    mode: REVIEW,
    gasSelected: AppConstants.GAS_OPTIONS.MEDIUM,
    stopUpdateGas: false,
    advancedGasInserted: false,
    EIP1559GasTransaction: {},
    EIP1559GasObject: {},
    legacyGasObject: {},
    legacyGasTransaction: {},
    multiLayerL1FeeTotal: '0x0',
    result: {},
    transactionMeta: {},
    isChangeInSimulationModalShown: false,
    hasHandledFirstGasUpdate: false,
  };

  originIsWalletConnect = this.props.transaction.origin?.startsWith(
    WALLET_CONNECT_ORIGIN,
  );

  originIsMMSDKRemoteConn = this.props.transaction.origin?.startsWith(
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
  );

  setNetworkNonce = async (): Promise<void> => {
    const { globalNetworkClientId, transaction } = this.props;
    const proposedNonce = await getNetworkNonce(
      { from: transaction.transaction.from || '' },
      globalNetworkClientId,
    );
    this.props.setNonce(proposedNonce.toString());
    this.props.setProposedNonce(proposedNonce.toString());
  };

  getAnalyticsParams = (): Record<string, unknown> => {
    const {
      selectedAsset,
      gasEstimateType,
      chainId,
      shouldUseSmartTransaction,
    } = this.props;
    const { gasSelected, fromSelectedAddress } = this.state;

    const baseParams = {
      active_currency: {
        value: selectedAsset?.symbol || 'N/A',
        anonymous: true,
      },
      account_type: fromSelectedAddress
        ? getAddressAccountType(fromSelectedAddress)
        : 'unknown',
      chain_id: chainId ? getDecimalChainId(chainId) : 'unknown',
      gas_estimate_type: gasEstimateType || 'unknown',
      gas_mode: gasSelected ? 'Basic' : 'Advanced',
      speed_set: gasSelected || undefined,
      request_source: this.originIsMMSDKRemoteConn
        ? AppConstants.REQUEST_SOURCES.SDK_REMOTE_CONN
        : this.originIsWalletConnect
        ? AppConstants.REQUEST_SOURCES.WC
        : AppConstants.REQUEST_SOURCES.IN_APP_BROWSER,
      is_smart_transaction: shouldUseSmartTransaction || false,
    };

    try {

      const smartTransactionMetricsProperties = {};

      return {
        ...baseParams,
        ...smartTransactionMetricsProperties,
      };
    } catch (error) {
      Logger.error(error as Error, 'Error in getAnalyticsParams:');
      return baseParams;
    }
  };

  updateNavBar = (): void => {
    const { navigation, route, transaction } = this.props;
    const colors = (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.confirm',
        navigation,
        route,
        colors,
        this.props.resetTransaction,
        transaction,
      ) as Record<string, unknown>,
    );
  };

  componentWillUnmount = async (): Promise<void> => {
    const {
      contractBalances,
      transactionState: { selectedAsset },
    } = this.props;

    const { transactionMeta } = this.state;
    const { TokensController } = Engine.context;
    if (this.state.pollToken) {
      await stopGasPolling();
    }
    clearInterval(intervalIdForEstimatedL1Fee);

    if (transactionMeta.id) {
      Engine.rejectPendingApproval(transactionMeta.id as string, new Error('Component unmounted'), {
        ignoreMissing: true,
        logErrors: false,
      });
    }

    if (
      isNativeToken(selectedAsset) ||
      selectedAsset.tokenId ||
      !selectedAsset.address
    ) {
      return;
    }

    const weiBalance = hexToBN(contractBalances[selectedAsset.address]);
    if (weiBalance?.isZero()) {
      await TokensController.ignoreTokens(
        [selectedAsset.address],
        this.props.networkClientId,
      );
    }
  };

  fetchEstimatedL1Fee = async (): Promise<void> => {
    const { transaction, chainId } = this.props;
    if (!transaction?.transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction.transaction as TransactionParams,
        chainId: chainId as `0x${string}`,
      });
      this.setState({
        multiLayerL1FeeTotal: result || '0x0',
      });
    } catch (e) {
      Logger.error(e as Error, 'fetchEstimatedMultiLayerL1Fee call failed');
      this.setState({
        multiLayerL1FeeTotal: '0x0',
      });
    }
  };

  componentDidMount = async (): Promise<void> => {
    const {
      chainId,
      showCustomNonce,
      isPaymentRequest,
    } = this.props;

    if (isMultiLayerFeeNetwork(chainId)) {
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        10000,
      );
      this.fetchEstimatedL1Fee();
    }

    const result = {};
    const transactionMeta = { id: Date.now().toString() };

    try {
      await ppomUtil.validateRequest({
        method: 'eth_sendTransaction',
        params: [this.props.transactionState.transaction],
        origin: this.props.transaction.origin,
      });

      // PPOM validation succeeded, but doesn't return result/transactionMeta
    } catch (error) {
      // PPOM validation failed, continue with empty result
    }

    this.setState({ result, transactionMeta });


    if (showCustomNonce) {
      this.setNetworkNonce();
    }

    const {
      transactionState: {
        transaction: { value: transactionValue, gas, from: transactionFrom },
      },
      contractBalances,
      selectedAsset,
      maxValueMode,
      gasFeeEstimates,
    } = this.props;
    const transactionTo = this.props.transactionState.transaction.to;

    const fromAddressChanged = this.state.fromSelectedAddress !== transactionFrom;
    const previousContractBalance = this.state.previousContractBalance;
    const contractBalanceChanged =
      previousContractBalance !== contractBalances[selectedAsset.address || ''];
    const haveEIP1559TotalMaxHexChanged =
      this.state.EIP1559GasTransaction.suggestedMaxFeePerGas !==
      (gasFeeEstimates as GasFeeEstimates)?.medium?.suggestedMaxFeePerGas;
    const isEIP1559Transaction = this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const haveGasFeeMaxNativeChanged =
      isEIP1559Transaction &&
      (haveEIP1559TotalMaxHexChanged ||
        this.state.EIP1559GasTransaction.suggestedMaxPriorityFeePerGas !==
          (gasFeeEstimates as GasFeeEstimates)?.medium?.suggestedMaxPriorityFeePerGas);

    const haveGasPropertiesChanged =
      fromAddressChanged ||
      contractBalanceChanged ||
      haveGasFeeMaxNativeChanged ||
      this.state.legacyGasTransaction.suggestedGasPrice !==
        (gasFeeEstimates as GasFeeEstimates)?.gasPrice;

    if (haveGasPropertiesChanged) {
      this.handleUpdateGas();
    }

    this.updateNavBar();
    this.parseTransactionDataHeader();

    if (isPaymentRequest) {
      this.onNext();
    }

    setTransactionId({ transactionId: transactionMeta.id });

    this.setState({
      gasEstimationReady: true,
      fromSelectedAddress: transactionFrom || '',
      previousContractBalance: contractBalances[selectedAsset.address || ''],
      transactionTo,
    });

    const gasEstimateTypeChanged =
      this.state.gasEstimateType !== this.props.gasEstimateType;
    const gasSelected = this.handleGasRecalculationForPaymentRequest(
      this.state.gasSelected,
    );

    if (gasEstimateTypeChanged) {
      this.setState({ gasSelected });
    }

    let error;
    if (maxValueMode) {
      error = this.validateAmount({
        transaction: {
          value: transactionValue,
          gas,
          data: this.props.transactionState.transaction.data
        },
        selectedAsset
      });
    }

    if (error) {
      this.setState({ errorMessage: error });
    }

    this.setState({ ready: true });
  };

  handleGasRecalculationForPaymentRequest = (gasSelected: string): string => {
    const { gasEstimateType } = this.props;
    if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      return AppConstants.GAS_OPTIONS.MEDIUM;
    }
    return gasSelected;
  };

  componentDidUpdate = (prevProps: ConfirmProps): void => {
    this.updateNavBar();
    const {
      transactionState: { transaction: stateTransaction },
    } = this.props;

    const {
      contractBalances,
      contractExchangeRates,
      conversionRate,
      currentCurrency,
      transactionState: {
        selectedAsset: currentSelectedAsset,
        transaction: { value, data },
      },
    } = this.props;

    let transactionValueFiat;
    if (isNativeToken(currentSelectedAsset)) {
      transactionValueFiat = weiToFiat(
        hexToBN(value || '0x0'),
        conversionRate,
        currentCurrency,
      );
    } else {
      const {
        address,
        decimals,
      } = currentSelectedAsset;

      const rawAmountString = decodeTransferData('transfer', data || '0x')[1];
      const transferValue = renderFromTokenMinimalUnit(
        rawAmountString,
        decimals || 18,
      );
      const exchangeRate = contractExchangeRates?.[address || ''];
      transactionValueFiat = balanceToFiat(
        transferValue,
        conversionRate,
        exchangeRate,
        currentCurrency,
      );
    }




    const {
      transactionState: { selectedAsset: updatedSelectedAsset, assetType },
      chainId,
    } = this.props;

    if (
      prevProps.transactionState.selectedAsset.address !==
        currentSelectedAsset.address ||
      prevProps.transactionState.transaction.value !== value ||
      prevProps.transactionState.transaction.data !== data ||
      prevProps.contractBalances !== contractBalances ||
      prevProps.contractExchangeRates !== contractExchangeRates ||
      prevProps.conversionRate !== conversionRate ||
      prevProps.currentCurrency !== currentCurrency
    ) {
      this.setState({ transactionValueFiat });
    }

    if (
      prevProps.chainId !== chainId &&
      isMultiLayerFeeNetwork(chainId) &&
      !isMultiLayerFeeNetwork(prevProps.chainId)
    ) {
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        10000,
      );
      this.fetchEstimatedL1Fee();
    } else if (
      prevProps.chainId !== chainId &&
      !isMultiLayerFeeNetwork(chainId) &&
      isMultiLayerFeeNetwork(prevProps.chainId)
    ) {
      clearInterval(intervalIdForEstimatedL1Fee);
    }

    if (
      prevProps.transactionState.transaction !== stateTransaction ||
      prevProps.transactionState.selectedAsset !== updatedSelectedAsset ||
      prevProps.transactionState.assetType !== assetType
    ) {
      prepareTransaction(this.props.transactionState.transaction);
    }
  };

  parseTransactionDataHeader = (): void => {
    const {
      transactionState: {
        transaction: { to, data },
      },
    } = this.props;
    let actionKey;
    if (data && data !== '0x' && to) {
      actionKey = 'transactions.transactionConfirm';
    } else {
      actionKey = 'transactions.transactionConfirm';
    }
    this.setState({ actionKey });
  };

  trackConfirmScreen = (): void => {
    const { metrics } = this.props;
    const analyticsParams = this.getAnalyticsParams();
    metrics.trackEvent(MetaMetricsEvents.SEND_TRANSACTION_STARTED, analyticsParams);
  };

  trackCancelScreen = (): void => {
    const { metrics } = this.props;
    const analyticsParams = this.getAnalyticsParams();
    metrics.trackEvent(MetaMetricsEvents.DAPP_TRANSACTION_CANCELLED, analyticsParams);
  };

  onCancel = (): void => {
    this.trackCancelScreen();
    this.props.resetTransaction();
    this.props.navigation.goBack();
  };

  getBalanceError = (balance: string): string | undefined => {
    const {
      transactionState: {
        transaction: { value = '0x0', gas = '0x0' },
      },
    } = this.props;
    let weiBalance, weiInput, diff;

    if (isDecimal(value)) {
      weiBalance = hexToBN(balance);
      weiInput = hexToBN(value).add(hexToBN(gas));
      diff = weiBalance.sub(weiInput);
    }

    if (diff?.isNeg?.() && weiInput && weiBalance) {
      const amount = renderFromWei(weiInput.sub(weiBalance));
      const tokenSymbol = getTicker(this.props.ticker);
      return strings('transaction.insufficient_amount', { amount, tokenSymbol });
    }
    return undefined;
  };

  validateAmount = ({ transaction, selectedAsset }: { transaction: Record<string, unknown>; selectedAsset: SelectedAsset }): string | undefined => {
    const {
      accounts,
      contractBalances,
    } = this.props;
    const { fromSelectedAddress } = this.state;
    let error;

    if (isNativeToken(selectedAsset)) {
      const checksummedAddress = fromSelectedAddress;
      const balance = accounts[checksummedAddress]?.balance;
      error = this.getBalanceError(balance);
    } else {
      const contractBalance = contractBalances[selectedAsset.address || ''];
      if (contractBalance && selectedAsset.address) {
        const { decimals } = selectedAsset;
        const transferValue = decodeTransferData('transfer', (transaction.data as string) || '0x')[1];
        const balanceBN = hexToBN(contractBalance);
        const transferValueBN = hexToBN(transferValue);
        const diff = balanceBN.sub(transferValueBN);
        if (diff.isNeg()) {
          const amount = renderFromTokenMinimalUnit(
            transferValueBN.sub(balanceBN),
            decimals || 18,
          );
          const tokenSymbol = selectedAsset.symbol;
          error = strings('transaction.insufficient_tokens', {
            amount,
            tokenSymbol,
          });
        }
      }
    }

    return error;
  };

  prepareTransactionToSend = (): Record<string, unknown> => {
    const {
      transactionState: { selectedAsset, assetType, transaction },
      showCustomNonce,
    } = this.props;
    const {
      fromSelectedAddress,
      legacyGasTransaction,
      EIP1559GasTransaction,
    } = this.state;

    const transactionToSend = {
      ...transaction,
      gas: this.state.gas ? BNToHex(this.state.gas) : transaction.gas,
      gasPrice: legacyGasTransaction.suggestedGasPrice,
      value: this.state.value ? BNToHex(this.state.value) : transaction.value,
      from: fromSelectedAddress,
      ...EIP1559GasTransaction,
    };

    if (showCustomNonce && this.state.proposedNonce) {
      transactionToSend.nonce = this.state.proposedNonce;
    }

    return {
      selectedAsset,
      assetType,
      transaction: transactionToSend,
    };
  };

  onNext = async (): Promise<void> => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      transactionState: { assetType, selectedAsset },
      navigation,
    } = this.props;
    const { fromSelectedAddress, transactionMeta } = this.state;

    this.setState({ ready: false });

    try {
      if (isQRHardwareAccount(fromSelectedAddress)) {
        navigation.navigate('QRSigningModal', {
          transactionMeta,
          assetType,
          selectedAsset,
        });
        return;
      }

      if (isHardwareAccount(fromSelectedAddress)) {
        const deviceId = await getDeviceId();
        navigation.navigate('HardwareTransactionModal', {
          transactionMeta,
          deviceId,
        });
        return;
      }

      await KeyringController.resetQRKeyringState();
      await ApprovalController.accept(transactionMeta.id as string, undefined, {
        waitForResult: true,
      });

      this.trackConfirmScreen();

      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...transactionMeta,
          assetType: selectedAsset,
        });
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage?.startsWith(KEYSTONE_TX_CANCELED)) {
        Alert.alert(
          strings('transactions.transaction_error'),
          errorMessage || '',
          [{ text: strings('navigation.ok') }],
        );
        Logger.error(error instanceof Error ? error : new Error(String(error)), 'error while trying to send transaction (Confirm)');
      } else {
        this.trackCancelScreen();
      }
      this.setState({ transactionHandled: false, ready: true });
    }
  };

  getGasAnalyticsParams = (): Record<string, unknown> => {
    try {
      const { gasEstimateType } = this.props;
      const { gasSelected } = this.state;
      return {
        gas_estimate_type: gasEstimateType,
        gas_mode: gasSelected ? 'Basic' : 'Advanced',
        speed_set: gasSelected || undefined,
      };
    } catch (error) {
      return {};
    }
  };

  handleUpdateGas = (): void => {
    const { gasEstimateType, gasFeeEstimates } = this.props;
    const { gasSelected } = this.state;

    const gasSelectedTemp = gasSelected;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const suggestedGasLimit = fromWei(this.props.transaction.transaction.gas || '0x0', 'wei');
      const gasLimitBN = hexToBN(suggestedGasLimit);

      this.setState({
        EIP1559GasTransaction: {
          suggestedMaxFeePerGas: (gasFeeEstimates as GasFeeEstimates)?.medium?.suggestedMaxFeePerGas,
          suggestedMaxPriorityFeePerGas: (gasFeeEstimates as GasFeeEstimates)?.medium?.suggestedMaxPriorityFeePerGas,
        },
        gas: gasLimitBN.toString(),
      });
    } else {
      const suggestedGasLimit = fromWei(this.props.transaction.transaction.gas || '0x0', 'wei');
      const gasLimitBN = hexToBN(suggestedGasLimit);

      this.setState({
        legacyGasTransaction: {
          suggestedGasPrice: (gasFeeEstimates as GasFeeEstimates)?.gasPrice,
        },
        gas: gasLimitBN.toString(),
      });
    }

    this.setState({
      gasSelected: gasSelectedTemp,
      gasEstimateType,
      hasHandledFirstGasUpdate: true,
    });
  };

  toggleHexDataModal = (): void => {
    const { hexDataModalVisible } = this.state;
    this.setState({ hexDataModalVisible: !hexDataModalVisible });
  };

  copyTransactionHash = async (): Promise<void> => {
    const { transactionMeta } = this.state;
    await ClipboardManager.setString(transactionMeta.transactionHash);
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transaction.transaction_id_copied') },
    });
  };

  renderTransactionReview = (): ReactNode => {
    const {
      chainId,
    } = this.props;
    const {
      gasSelected,
      EIP1559GasTransaction,
      legacyGasTransaction,
      multiLayerL1FeeTotal,
    } = this.state;

    return (
      <TransactionReview
        primaryCurrency={this.props.primaryCurrency}
        hideTotal
        noMargin
        onEdit={() => this.setState({ mode: EDIT })}
        onUpdatingValuesStart={() => {
          // Required callback for TransactionReview component
        }}
        onUpdatingValuesEnd={() => {
          // Required callback for TransactionReview component
        }}
        originWarning=""
        multiLayerL1FeeTotal={multiLayerL1FeeTotal}
        onlyGas
        chainId={chainId}
        animateOnChange={false}
        isAnimating={false}
        gasEstimationReady={this.state.gasEstimationReady}
        legacy
        gasSelected={gasSelected}
        gasObject={EIP1559GasTransaction}
        gasObjectLegacy={legacyGasTransaction}
        updateTransactionState={() => {
          // Required callback for TransactionReview component
        }}
      />
    );
  };

  renderCustomNonce = (): ReactNode => {
    const { showCustomNonce } = this.props;
    const { proposedNonce } = this.state;

    return (
      showCustomNonce && (
        <CustomNonce
          nonce={parseInt(proposedNonce || '0', 10)}
          onNonceEdit={(nonce: string) => this.setState({ proposedNonce: nonce })}
        />
      )
    );
  };

  renderDetails = (): ReactNode => {
    const {
      selectedAsset,
    } = this.props;
    const { mode } = this.state;

    const colors = (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (mode === EDIT) {
      return this.renderTransactionReview();
    }

    return (
      <View style={styles.wrapper}>
        <AccountFromToInfoCard
          transactionState={this.props.transactionState as any}
          asset={selectedAsset as any}
          url=""
          origin=""
        />
        {this.renderCustomNonce()}
      </View>
    );
  };

  renderHexDataModal = (): ReactNode => {
    const { hexDataModalVisible } = this.state;
    const { transaction } = this.props;
    const colors = (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        isVisible={hexDataModalVisible}
        onBackdropPress={this.toggleHexDataModal}
        onBackButtonPress={this.toggleHexDataModal}
        onSwipeComplete={this.toggleHexDataModal}
        swipeDirection={'down'}
        propagateSwipe
      >
        <View style={styles.wrapper}>
          <TouchableOpacity
            style={styles.wrapper}
            onPress={this.toggleHexDataModal}
          >
            <IonicIcon
              name={'ios-close'}
              size={28}
              color={colors.text.default}
            />
          </TouchableOpacity>
          <View style={styles.wrapper}>
            <Text style={styles.textAmountLabel}>
              {strings('transaction.hex_data')}
            </Text>
            <TouchableOpacity onPress={this.copyTransactionHash}>
              <Text style={styles.textAmountLabel}>
                {transaction.transaction.data || strings('unit.empty_data')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  renderWarning = (): ReactNode => {
    const warningMessage = (this.props.transactionState as TransactionState & { warningMessage?: string })?.warningMessage;
    const { result } = this.state;

    if (!warningMessage && !result?.description) return null;

    return (
      <WarningMessage
        warningMessage={warningMessage}
      />
    );
  };

  render = (): ReactNode => {
    const {
      gasEstimationReady,
      ready,
      errorMessage,
      hexDataModalVisible,
    } = this.state;
    const colors = (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (!gasEstimationReady || !ready) {
      return (
        <View style={styles.wrapper}>
          <ActivityIndicator size="small" color={colors.primary.default} />
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.wrapper} testID={ConfirmViewSelectorsIDs.CONTAINER}>
        <View style={styles.wrapper}>
          <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
            {this.renderWarning()}
            {this.renderDetails()}
          </ScrollView>
          <View style={styles.wrapper}>
            <StyledButton
              type={'confirm'}
              disabled={Boolean(errorMessage)}
              containerStyle={styles.wrapper}
              onPress={this.onNext}
              testID={ConfirmViewSelectorsIDs.SEND_BUTTON}
            >
              {strings('transaction.send')}
            </StyledButton>
          </View>
        </View>
        {hexDataModalVisible && this.renderHexDataModal()}
        <GlobalAlert />
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (state: RootState) => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId || selectEvmChainId(state);

  const networkClientId =
    transaction?.networkClientId || selectNetworkClientId(state);

  return {
    accounts: selectAccounts(state),
    contractExchangeRates: selectContractExchangeRates(state),
    contractBalances: selectContractBalances(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    providerType: selectProviderTypeByChainId(state, chainId),
    showHexData: state.settings.showHexData,
    showCustomNonce: state.settings.showCustomNonce,
    chainId,
    networkClientId,
    globalNetworkClientId: selectNetworkClientId(state),
    ticker: selectNativeCurrencyByChainId(state, chainId),
    transaction,
    selectedAsset: state.transaction.selectedAsset,
    transactionState: state.transaction,
    primaryCurrency: state.settings.primaryCurrency,
    gasFeeEstimates: selectGasFeeEstimates(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    isPaymentRequest: state.transaction.paymentRequest,
    isNativeTokenBuySupported: isNetworkRampNativeTokenSupported(
      chainId,
      getRampNetworks(state),
    ),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    confirmationMetricsById: {},
    transactionMetadata: {},
    securityAlertResponse: {},
    maxValueMode: state.transaction.maxValueMode,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  prepareTransaction: (transaction: Record<string, unknown>) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionId: (transactionId: string) =>
    dispatch(setTransactionId({ transactionId })),
  setNonce: (nonce: string) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: string) => dispatch(setProposedNonce(nonce)),
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: Record<string, unknown>) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  showAlert: (config: { isVisible: boolean; autodismiss: number; content: string; data: Record<string, unknown> }) => dispatch(showAlert(config)),
  updateConfirmationMetric: ({ id, params }: { id: string; params: Record<string, unknown> }) =>
    dispatch({ type: 'UPDATE_CONFIRMATION_METRIC', payload: { id, params } }),
  setTransactionValue: (value: string) => dispatch(setTransactionValue(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Confirm as React.ComponentType<any>));
