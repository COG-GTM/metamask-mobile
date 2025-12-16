import React, { PureComponent } from 'react';
import { baseStyles } from '../../../../../../styles/common';
import {
  InteractionManager,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { getSendFlowTitle } from '../../../../../UI/Navbar';
import Eth from '@metamask/ethjs-query';
import { isEmpty } from 'lodash';
import {
  renderFromWei,
  renderFromTokenMinimalUnit,
  weiToFiat,
  balanceToFiat,
  isDecimal,
  hexToBN,
} from '../../../../../../util/number';
import {
  getTicker,
  decodeTransferData,
  getNormalizedTxState,
} from '../../../../../../util/transactions';
import StyledButton from '../../../../../UI/StyledButton';
import { WalletDevice } from '@metamask/transaction-controller';
import { ChainId } from '@metamask/controller-utils';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import {
  prepareTransaction,
  resetTransaction,
  setNonce,
  setProposedNonce,
  setTransactionId,
  setTransactionValue,
} from '../../../../../../actions/transaction';
import { getGasLimit } from '../../../../../../util/custom-gas';
import Engine from '../../../../../../core/Engine';
import Logger from '../../../../../../util/Logger';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import CustomNonceModal from '../components/CustomNonceModal';
import NotificationManager from '../../../../../../core/NotificationManager';
import { strings } from '../../../../../../../locales/i18n';
import CollectibleMedia from '../../../../../UI/CollectibleMedia';
import Modal from 'react-native-modal';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import TransactionTypes from '../../../../../../core/TransactionTypes';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import { shallowEqual, renderShortText } from '../../../../../../util/general';
import {
  isTestNet,
  isMainnetByChainId,
  isMultiLayerFeeNetwork,
  TESTNET_FAUCETS,
  isTestNetworkWithFaucet,
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
import Routes from '../../../../../../constants/navigation/Routes';
import WarningMessage from '../WarningMessage';
import { showAlert } from '../../../../../../actions/alert';
import ClipboardManager from '../../../../../../core/ClipboardManager';
import GlobalAlert from '../../../../../UI/GlobalAlert';
import createStyles from './styles';
import {
  startGasPolling,
  stopGasPolling,
} from '../../../../../../core/GasPolling/GasPolling';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../selectors/currencyRateController';

import { selectAccounts } from '../../../../../../selectors/accountTrackerController';
import { selectContractBalances } from '../../../../../../selectors/tokenBalancesController';
import { isNetworkRampNativeTokenSupported } from '../../../../../../components/UI/Ramp/utils';
import { getRampNetworks } from '../../../../../../reducers/fiatOrders';
import { ConfirmViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/ConfirmView.selectors';
import ExtendedKeyringTypes from '../../../../../../constants/keyringTypes';
import { getDeviceId } from '../../../../../../core/Ledger/Ledger';
import { getBlockaidTransactionMetricsParams } from '../../../../../../util/blockaid';
import ppomUtil from '../../../../../../lib/ppom/ppom-util';
import TransactionBlockaidBanner from '../../components/TransactionBlockaidBanner/TransactionBlockaidBanner';
import { createLedgerTransactionModalNavDetails } from '../../../../../../components/UI/LedgerModals/LedgerTransactionModal';
import CustomGasModal from './components/CustomGasModal';
import { ResultType } from '../../components/BlockaidBanner/BlockaidBanner.types';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import {
  selectCurrentTransactionMetadata,
  selectCurrentTransactionSecurityAlertResponse,
  selectGasFeeEstimates,
} from '../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../selectors/gasFeeController';
import { createBuyNavigationDetails } from '../../../../../UI/Ramp/routes/utils';
import {
  getNetworkNonce,
  updateTransaction,
} from '../../../../../../util/transaction-controller';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../../../../util/smart-transactions/smart-publish-hook';
import { getSmartTransactionMetricsProperties } from '../../../../../../util/smart-transactions';
import { TransactionConfirmViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/TransactionConfirmView.selectors.js';
import {
  selectConfirmationMetrics,
  updateConfirmationMetric,
} from '../../../../../../core/redux/slices/confirmationMetrics';
import {
  validateSufficientTokenBalance,
  validateSufficientBalance,
} from './validation';
import { buildTransactionParams } from '../../../../../../util/confirmation/transactions';
import {
  selectEvmChainId,
  selectNativeCurrencyByChainId,
  selectNetworkClientId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import { updateTransactionToMaxValue } from './utils';
import SmartTransactionsMigrationBanner from '../../components/SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { isNativeToken } from '../../../utils/generic';
import { RootState } from '../../../../../../reducers';
import { Dispatch } from 'redux';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import BN from 'bn.js';

const EDIT = 'edit';
const EDIT_NONCE = 'edit_nonce';
const REVIEW = 'review';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

interface ThemeColors {
  background: {
    default: string;
  };
  text: {
    default: string;
    alternative: string;
    muted: string;
  };
  primary: {
    default: string;
    inverse: string;
  };
  border: {
    default: string;
    muted: string;
  };
  error: {
    default: string;
    muted: string;
  };
  warning: {
    default: string;
  };
  overlay: {
    default: string;
  };
}

interface Theme {
  colors: ThemeColors;
  themeAppearance?: string;
}

interface AccountInfo {
  balance: string;
}

interface TokenAsset {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  tokenId?: string;
  image?: string;
  isETH?: boolean;
}

interface CollectibleAsset {
  address: string;
  tokenId: string;
  name?: string;
  image?: string;
}

interface TransactionObject {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  chainId?: string;
}

interface TransactionState {
  transaction: TransactionObject;
  transactionTo?: string;
  transactionValue?: string;
  selectedAsset: TokenAsset | CollectibleAsset;
  assetType?: string;
  paymentRequest?: boolean;
}

interface NormalizedTransaction {
  from?: string;
  transactionTo?: string;
  transactionValue?: string;
  data?: string;
  origin?: string;
  chainId?: string;
  networkClientId?: string;
  nonce?: string;
  proposedNonce?: string;
}

interface GasFeeEstimates {
  estimatedBaseFee?: string;
  gasPrice?: string;
  low?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  medium?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  high?: { suggestedMaxPriorityFeePerGas: string; suggestedMaxFeePerGas: string };
  [key: string]: unknown;
}

interface ContractExchangeRate {
  price?: number;
}

interface SecurityAlertResponse {
  result_type?: string;
  reason?: string;
  features?: string[];
}

interface TransactionMetadata {
  id?: string;
  simulationData?: {
    isUpdatedAfterSecurityCheck?: boolean;
  };
}

interface ConfirmationMetric {
  properties?: Record<string, unknown>;
}

interface MetricsInterface {
  trackEvent: (event: unknown) => void;
  createEventBuilder: (event: unknown) => {
    addProperties: (props: Record<string, unknown>) => {
      build: () => unknown;
    };
    build: () => unknown;
  };
}

interface EIP1559GasTransaction {
  totalMaxHex?: string;
  gasFeeMaxHex?: string;
  error?: string;
}

interface LegacyGasTransaction {
  gasFeeMaxHex?: string;
  error?: string;
}

interface GasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
}

interface ConfirmProps {
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase, string>;
  accounts: Record<string, AccountInfo>;
  contractBalances: Record<string, string>;
  ticker: string;
  transactionState: TransactionState;
  transaction: NormalizedTransaction;
  conversionRate: number;
  currentCurrency: string;
  contractExchangeRates: Record<string, ContractExchangeRate>;
  prepareTransaction: (transaction: Record<string, unknown>) => void;
  chainId: string;
  networkClientId: string;
  globalNetworkClientId: string;
  showHexData: boolean;
  showCustomNonce: boolean;
  providerType: string;
  selectedAsset: TokenAsset | CollectibleAsset;
  resetTransaction: () => void;
  primaryCurrency: string;
  setNonce: (nonce: number) => void;
  setProposedNonce: (nonce: number) => void;
  gasFeeEstimates: GasFeeEstimates;
  gasEstimateType: string;
  isPaymentRequest: boolean;
  showAlert: (config: { isVisible: boolean; autodismiss: number; content: string; data: { msg: string } }) => void;
  isNativeTokenBuySupported: boolean;
  metrics: MetricsInterface;
  setTransactionId: (transactionId: string) => void;
  shouldUseSmartTransaction: boolean;
  confirmationMetricsById: Record<string, ConfirmationMetric>;
  transactionMetadata: TransactionMetadata;
  updateConfirmationMetric: (params: { id: string; params: { properties: Record<string, unknown> } }) => void;
  securityAlertResponse: SecurityAlertResponse;
  maxValueMode: boolean;
  setTransactionValue: (value: string) => void;
}

interface ConfirmState {
  gasEstimationReady: boolean;
  fromSelectedAddress: string | undefined;
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
  EIP1559GasObject: GasObject;
  legacyGasObject: GasObject;
  legacyGasTransaction: LegacyGasTransaction;
  multiLayerL1FeeTotal: string;
  result: Record<string, unknown>;
  transactionMeta: Record<string, unknown>;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  pollToken?: string;
  closeModal?: boolean;
  transactionConfirmed?: boolean;
  balanceIsZero?: boolean;
  isAnimating?: boolean;
  animateOnChange?: boolean;
  gasSelectedTemp?: string;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class Confirm extends PureComponent<ConfirmProps, ConfirmState> {
  static contextType = ThemeContext;
  declare context: Theme;

  scrollView: ScrollView | null = null;

  state: ConfirmState = {
    gasEstimationReady: false,
    fromSelectedAddress: this.props.transactionState.transaction.from,
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
    const { globalNetworkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(
      transaction,
      globalNetworkClientId,
    );
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
  };

  getAnalyticsParams = (transactionMeta?: Record<string, unknown>): Record<string, unknown> => {
    const {
      selectedAsset,
      gasEstimateType,
      chainId,
      shouldUseSmartTransaction,
    } = this.props;
    const { gasSelected, fromSelectedAddress } = this.state;

    // Define baseParams with safe fallback values
    const baseParams: Record<string, unknown> = {
      active_currency: {
        value: (selectedAsset as TokenAsset)?.symbol || 'N/A',
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
      const { SmartTransactionsController } = Engine.context;

      const smartTransactionMetricsProperties =
        getSmartTransactionMetricsProperties(
          SmartTransactionsController,
          transactionMeta,
        );

      // Merge baseParams with the additional smart transaction properties
      return {
        ...baseParams,
        ...smartTransactionMetricsProperties,
      };
    } catch (error) {
      // Log the error and return the baseParams
      Logger.error(error as Error, 'Error in getAnalyticsParams:');
      return baseParams;
    }
  };

  updateNavBar = (): void => {
    const { navigation, route, resetTransaction, transaction } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getSendFlowTitle(
        'send.confirm',
        navigation,
        route,
        colors,
        resetTransaction,
        transaction,
      ),
    );
  };

  componentWillUnmount = async (): Promise<void> => {
    const {
      contractBalances,
      transactionState: { selectedAsset },
    } = this.props;

    const { transactionMeta } = this.state;
    const { TokensController } = Engine.context;
    await stopGasPolling(this.state.pollToken);
    if (intervalIdForEstimatedL1Fee) {
      clearInterval(intervalIdForEstimatedL1Fee);
    }

    Engine.rejectPendingApproval((transactionMeta as { id?: string }).id, undefined, {
      ignoreMissing: true,
      logErrors: false,
    });

    /**
     * Remove token that was added to the account temporarily
     * Ref.: https://github.com/MetaMask/metamask-mobile/pull/3989#issuecomment-1367558394
     */
    if (
      isNativeToken(selectedAsset) ||
      (selectedAsset as CollectibleAsset).tokenId ||
      !(selectedAsset as TokenAsset).address
    ) {
      return;
    }

    const weiBalance = hexToBN(contractBalances[(selectedAsset as TokenAsset).address]);
    if (weiBalance?.isZero()) {
      await TokensController.ignoreTokens(
        [(selectedAsset as TokenAsset).address],
        this.props.networkClientId,
      );
    }
  };

  fetchEstimatedL1Fee = async (): Promise<void> => {
    const { transaction, chainId } = this.props;
    if (!transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction,
        chainId,
      });
      this.setState({
        multiLayerL1FeeTotal: result,
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
      globalNetworkClientId,
      showCustomNonce,
      navigation,
      providerType,
      isPaymentRequest,
      setTransactionId,
    } = this.props;

    const {
      from,
      transactionTo: to,
      transactionValue: value,
      data,
    } = this.props.transaction;

    this.updateNavBar();
    this.getGasLimit();

    const pollToken = await startGasPolling(this.state.pollToken);
    this.setState({
      pollToken,
    });
    // For analytics
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SEND_TRANSACTION_STARTED)
        .addProperties(this.getAnalyticsParams())
        .build(),
    );

    showCustomNonce && (await this.setNetworkNonce());
    navigation.setParams({ providerType, isPaymentRequest });
    this.parseTransactionDataHeader();
    if (isMultiLayerFeeNetwork(chainId)) {
      this.fetchEstimatedL1Fee();
      intervalIdForEstimatedL1Fee = setInterval(
        this.fetchEstimatedL1Fee,
        POLLING_INTERVAL_ESTIMATED_L1_FEE,
      );
    }
    // add transaction
    const { TransactionController } = Engine.context;
    const transactionParams = this.prepareTransactionToSend();

    let result: Record<string, unknown>, transactionMeta: Record<string, unknown>;
    try {
      ({ result, transactionMeta } = await TransactionController.addTransaction(
        transactionParams,
        {
          deviceConfirmedOn: WalletDevice.MM_MOBILE,
          networkClientId: globalNetworkClientId,
          origin: TransactionTypes.MMM,
        },
      ));
    } catch (error) {
      Logger.error(error as Error, 'error while adding transaction (Confirm)');
      navigation.navigate(Routes.WALLET_VIEW);
      Alert.alert(
        strings('transactions.transaction_error'),
        error && (error as Error).message,
        [{ text: 'OK' }],
      );
      return;
    }

    setTransactionId((transactionMeta as { id: string }).id);

    this.setState({ result, transactionMeta });

    // start validate ppom
    const id = (transactionMeta as { id: string }).id;
    const reqObject = {
      id,
      jsonrpc: '2.0',
      method: 'eth_sendTransaction',
      origin: isPaymentRequest
        ? AppConstants.DEEPLINKS.ORIGIN_DEEPLINK
        : TransactionTypes.MM,
      params: [
        {
          from,
          to,
          value,
          data,
        },
      ],
    };

    ppomUtil.validateRequest(reqObject, id);
  };

  componentDidUpdate = (prevProps: ConfirmProps, prevState: ConfirmState): void => {
    const {
      accounts,
      transactionState: {
        transactionTo,
        transaction: { value, gas, from },
      },
      contractBalances,
      selectedAsset,
      maxValueMode,
      gasFeeEstimates,
    } = this.props;

    const { transactionMeta } = this.state;
    const { id: transactionId } = transactionMeta as { id?: string };

    this.updateNavBar();

    const transaction = this.prepareTransactionToSend();
    const { EIP1559GasTransaction, legacyGasTransaction } = this.state;

    let error: string | undefined;

    if (this.state?.closeModal) this.toggleConfirmationModal(REVIEW);

    const { errorMessage, fromSelectedAddress } = this.state;
    const valueChanged = prevProps.transactionState.transaction.value !== value;
    const fromAddressChanged =
      prevState.fromSelectedAddress !== fromSelectedAddress;
    const previousContractBalance =
      prevProps.contractBalances[(selectedAsset as TokenAsset).address];
    const newContractBalance = contractBalances[(selectedAsset as TokenAsset).address];
    const contractBalanceChanged =
      previousContractBalance !== newContractBalance;
    const recipientIsDefined = transactionTo !== undefined;
    const haveEIP1559TotalMaxHexChanged =
      EIP1559GasTransaction.totalMaxHex !==
      prevState.EIP1559GasTransaction.totalMaxHex;
    const isEIP1559Transaction =
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const haveGasFeeMaxNativeChanged = isEIP1559Transaction
      ? EIP1559GasTransaction.gasFeeMaxHex !==
        prevState.EIP1559GasTransaction.gasFeeMaxHex
      : legacyGasTransaction.gasFeeMaxHex !==
        prevState.legacyGasTransaction.gasFeeMaxHex;

    const haveGasPropertiesChanged =
      (this.props.gasFeeEstimates &&
        gas &&
        (!prevProps.gasFeeEstimates ||
          !shallowEqual(
            prevProps.gasFeeEstimates,
            this.props.gasFeeEstimates,
          ) ||
          gas !== prevProps?.transactionState?.transaction?.gas)) ||
      haveEIP1559TotalMaxHexChanged;

    if (
      recipientIsDefined &&
      (valueChanged || fromAddressChanged || contractBalanceChanged)
    ) {
      this.parseTransactionDataHeader();
    }
    if (!prevState.errorMessage && errorMessage) {
      this.scrollView?.scrollToEnd({ animated: true });
    }

    if (
      transactionId &&
      maxValueMode &&
      (selectedAsset as TokenAsset).isETH &&
      !isEmpty(gasFeeEstimates) &&
      (haveGasFeeMaxNativeChanged ||
        (this.state.hasHandledFirstGasUpdate && !(prevState.transactionMeta as { id?: string })?.id))
    ) {
      updateTransactionToMaxValue({
        transactionId,
        isEIP1559Transaction,
        EIP1559GasTransaction,
        legacyGasTransaction,
        accountBalance: accounts[from || ''].balance,
        setTransactionValue: this.props.setTransactionValue,
      });

      return;
    }

    if (haveGasPropertiesChanged) {
      const gasEstimateTypeChanged =
        prevProps.gasEstimateType !== this.props.gasEstimateType;
      const gasSelected = gasEstimateTypeChanged
        ? AppConstants.GAS_OPTIONS.MEDIUM
        : this.state.gasSelected;

      if (
        (!this.state.stopUpdateGas && !this.state.advancedGasInserted) ||
        gasEstimateTypeChanged
      ) {
        if (this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
          error = this.validateAmount({
            transaction,
          });
          this.setError(error);
          this.setState(
            {
              gasEstimationReady: true,
              animateOnChange: true,
              gasSelected,
            },
            () => {
              this.setState({ animateOnChange: false });
            },
          );
        } else if (this.props.gasEstimateType !== GAS_ESTIMATE_TYPES.NONE) {
          this.setError(this.state.legacyGasTransaction.error);
          this.setState(
            {
              gasEstimationReady: true,
              animateOnChange: true,
              gasSelected,
            },
            () => {
              this.setState({ animateOnChange: false });
            },
          );
        } else {
          error = this.validateAmount({
            transaction,
          });
          this.setError(error);
        }
        this.parseTransactionDataHeader();
      }
    }

    // Track if this is the first gas update
    if (haveGasFeeMaxNativeChanged && !this.state.hasHandledFirstGasUpdate) {
      this.setState({ hasHandledFirstGasUpdate: true });
    }
  };

  setScrollViewRef = (ref: ScrollView | null): void => {
    this.scrollView = ref;
  };

  toggleConfirmationModal = (MODE: string): void => {
    this.onModeChange(MODE);
    this.setState({ closeModal: false });
  };

  onModeChange = (mode: string): void => {
    this.setState({ mode });
    if (mode === EDIT) {
      this.props.metrics.trackEvent(
        this.props.metrics
          .createEventBuilder(
            MetaMetricsEvents.SEND_FLOW_ADJUSTS_TRANSACTION_FEE,
          )
          .build(),
      );
    }
  };

  getGasLimit = async (): Promise<void> => {
    const {
      prepareTransaction,
      transactionState: { transaction },
    } = this.props;
    const { networkClientId } = this.props;
    const estimation = await getGasLimit(transaction, true, networkClientId);
    prepareTransaction({ ...transaction, ...estimation });
  };

  parseTransactionDataHeader = async (): Promise<void> => {
    const {
      contractBalances,
      contractExchangeRates,
      conversionRate,
      currentCurrency,
      transactionState: {
        selectedAsset,
        transaction: { value, data },
      },
      ticker,
    } = this.props;

    let transactionValue: string | undefined, transactionValueFiat: string | undefined;
    const valueBN = hexToBN(value || '0x0');
    const symbol = ticker ?? (selectedAsset as TokenAsset)?.symbol;
    const parsedTicker = getTicker(symbol);

    if (isNativeToken(selectedAsset)) {
      transactionValue = `${renderFromWei(value)} ${parsedTicker}`;
      transactionValueFiat = weiToFiat(
        valueBN,
        conversionRate,
        currentCurrency,
      );
    } else if ((selectedAsset as CollectibleAsset).tokenId) {
      transactionValueFiat = weiToFiat(
        valueBN,
        conversionRate,
        currentCurrency,
      );
    } else {
      const {
        address,
        symbol: assetSymbol = 'ERC20',
        decimals,
        image,
        name,
      } = selectedAsset as TokenAsset;
      const { TokensController } = Engine.context;

      if (!contractBalances[address]) {
        await TokensController.addToken({
          address,
          symbol: assetSymbol,
          decimals,
          image,
          name,
          networkClientId: this.props.networkClientId,
        });
      }

      const [, , rawAmount] = decodeTransferData('transfer', data);
      const rawAmountString = parseInt(rawAmount, 16).toLocaleString(
        'fullwide',
        { useGrouping: false },
      );
      const transferValue = renderFromTokenMinimalUnit(
        rawAmountString,
        decimals,
      );
      transactionValue = `${transferValue} ${assetSymbol}`;
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[address]?.price
        : undefined;
      transactionValueFiat =
        balanceToFiat(
          transferValue,
          conversionRate,
          exchangeRate,
          currentCurrency,
        ) || `0 ${currentCurrency}`;
    }
    this.setState({
      transactionValue,
      transactionValueFiat,
    });
  };

  prepareTransactionToSend = (): Record<string, unknown> => {
    const {
      gasEstimateType,
      showCustomNonce,
      transaction: rawTransaction,
    } = this.props;

    const {
      fromSelectedAddress: from,
      legacyGasTransaction: gasDataLegacy,
      EIP1559GasTransaction: gasDataEIP1559,
    } = this.state;

    const transaction = {
      ...rawTransaction,
      from,
    };

    return buildTransactionParams({
      gasDataEIP1559,
      gasDataLegacy,
      gasEstimateType,
      showCustomNonce,
      transaction,
    });
  };

  /**
   * Removes collectible in case an ERC721 asset is being sent, when not in mainnet
   */
  checkRemoveCollectible = (): void => {
    const {
      transactionState: { selectedAsset, assetType },
      chainId,
    } = this.props;
    const { fromSelectedAddress } = this.state;
    if (assetType === 'ERC721' && chainId !== ChainId.mainnet) {
      const { NftController } = Engine.context;
      removeFavoriteCollectible(fromSelectedAddress, chainId, selectedAsset);
      NftController.removeNft((selectedAsset as CollectibleAsset).address, (selectedAsset as CollectibleAsset).tokenId);
    }
  };

  /**
   * Validates transaction balances
   * @returns - Whether there is an error with the amount
   */
  validateAmount = ({ transaction }: { transaction: Record<string, unknown> }): string | undefined => {
    const {
      accounts,
      contractBalances,
      selectedAsset,
      ticker,
      transactionState: {
        transaction: { value },
      },
      updateConfirmationMetric,
    } = this.props;
    const { EIP1559GasTransaction, legacyGasTransaction, transactionMeta } =
      this.state;
    const { id: transactionId } = transactionMeta as { id?: string };
    const isEIP1559Transaction =
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const { gasFeeMaxHex } = isEIP1559Transaction
      ? EIP1559GasTransaction
      : legacyGasTransaction;

    const transactionFeeMax = hexToBN(gasFeeMaxHex || '0x0');
    const transactionValueHex = hexToBN(value || '0x0');

    const totalTransactionValue = transactionValueHex.add(transactionFeeMax);

    const selectedAddress = transaction?.from as string;
    const weiBalance = hexToBN(accounts[selectedAddress]?.balance || '0x0');

    if (!isDecimal(value)) {
      return strings('transaction.invalid_amount');
    }

    const insufficientBalanceMessage = validateSufficientBalance(
      weiBalance,
      totalTransactionValue,
      ticker,
    );

    if (insufficientBalanceMessage && transactionId) {
      updateConfirmationMetric({
        id: transactionId,
        params: {
          properties: {
            alert_triggered: ['insufficient_funds_for_gas'],
          },
        },
      });
    }

    if (isNativeToken(selectedAsset) || (selectedAsset as CollectibleAsset).tokenId) {
      return insufficientBalanceMessage;
    }

    const insufficientTokenBalanceMessage = validateSufficientTokenBalance(
      transaction,
      contractBalances,
      selectedAsset,
    );

    return insufficientBalanceMessage || insufficientTokenBalanceMessage;
  };

  setError = (errorMessage: string | undefined): void => {
    this.setState({ errorMessage }, () => {
      if (errorMessage) {
        this.scrollView?.scrollToEnd({ animated: true });
      }
    });
  };

  onLedgerConfirmation = async (
    approve: boolean,
    result: Record<string, unknown>,
    transactionMeta: Record<string, unknown>,
    assetType: string | undefined,
    gaParams: Record<string, unknown>,
  ): Promise<void> => {
    const { navigation } = this.props;
    // Manual cancel from UI or rejected from ledger device.
    try {
      if (approve) {
        await new Promise((resolve) => resolve(result));

        if ((transactionMeta as { error?: Error }).error) {
          throw (transactionMeta as { error: Error }).error;
        }

        InteractionManager.runAfterInteractions(() => {
          NotificationManager.watchSubmittedTransaction({
            ...transactionMeta,
            assetType,
          });
          this.checkRemoveCollectible();
          this.props.metrics.trackEvent(
            this.props.metrics
              .createEventBuilder(MetaMetricsEvents.SEND_TRANSACTION_COMPLETED)
              .addProperties(gaParams)
              .build(),
          );
          stopGasPolling();
          resetTransaction();
        });
      }
    } finally {
      // Error handling derived to LedgerConfirmationModal component
      navigation && (navigation as unknown as { dangerouslyGetParent: () => { popToTop: () => void } | null }).dangerouslyGetParent()?.popToTop();
    }
  };

  onNext = async (): Promise<void> => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      transactionState: { assetType },
      navigation,
      resetTransaction,
      shouldUseSmartTransaction,
      transactionMetadata,
    } = this.props;

    const transactionSimulationData = transactionMetadata?.simulationData;
    const { isUpdatedAfterSecurityCheck } = transactionSimulationData ?? {};

    const { transactionConfirmed, isChangeInSimulationModalShown } = this.state;
    if (transactionConfirmed) return;

    if (isUpdatedAfterSecurityCheck && !isChangeInSimulationModalShown) {
      navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.CHANGE_IN_SIMULATION_MODAL,
        params: {
          onProceed: () => {
            this.setState({ isChangeInSimulationModalShown: true });
          },
          onReject: () => {
            this.setState({ isChangeInSimulationModalShown: true });
            resetTransaction();
            (navigation as unknown as { dangerouslyGetParent: () => { pop: () => void } | null }).dangerouslyGetParent()?.pop();
          },
        },
      });
      return;
    }

    this.setState({ transactionConfirmed: true, stopUpdateGas: true });
    try {
      const transaction = this.prepareTransactionToSend();

      const error = this.validateAmount({
        transaction,
      });
      this.setError(error);
      if (error) {
        this.setState({ transactionConfirmed: false, stopUpdateGas: true });
        return;
      }

      const { result, transactionMeta } = this.state;

      await this.persistTransactionParameters(transaction);

      const isLedgerAccount = isHardwareAccount(transaction.from as string, [
        ExtendedKeyringTypes.ledger,
      ]);

      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionConfirmed: false });
        // Approve transaction for ledger is called in the Confirmation Flow (modals) after user prompt
        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: (transactionMeta as { id: string }).id,
            deviceId,
            onConfirmationComplete: async (approve: boolean) =>
              await this.onLedgerConfirmation(
                approve,
                result,
                transactionMeta,
                assetType,
                {
                  ...this.getAnalyticsParams(),
                  ...getBlockaidTransactionMetricsParams(transaction),
                  ...this.getTransactionMetrics(),
                },
              ),
            type: 'signTransaction',
          }),
        );
        return;
      }

      await KeyringController.resetQRKeyringState();

      if (shouldUseSmartTransaction) {
        await ApprovalController.accept((transactionMeta as { id: string }).id, undefined, {
          waitForResult: false,
        });
        navigation.navigate(Routes.TRANSACTIONS_VIEW);
      } else {
        await ApprovalController.accept((transactionMeta as { id: string }).id, undefined, {
          waitForResult: true,
        });
      }

      await new Promise((resolve) => resolve(result));

      if ((transactionMeta as { error?: Error }).error) {
        throw (transactionMeta as { error: Error }).error;
      }

      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...transactionMeta,
          assetType,
        });
        this.checkRemoveCollectible();
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.SEND_TRANSACTION_COMPLETED)
            .addProperties({
              ...this.getAnalyticsParams(transactionMeta),
              ...getBlockaidTransactionMetricsParams(transaction),
              ...this.getTransactionMetrics(),
            })
            .build(),
        );
        stopGasPolling();
        resetTransaction();

        if (!shouldUseSmartTransaction) {
          navigation.navigate(Routes.TRANSACTIONS_VIEW);
        }
      });
    } catch (error) {
      if (
        !(error as Error)?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !(error as Error)?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          error && (error as Error).message,
          [{ text: 'OK' }],
        );
        Logger.error(error as Error, 'error while trying to send transaction (Confirm)');
      } else {
        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      resetTransaction();
      navigation.navigate(Routes.WALLET_VIEW);
    }
    this.setState({ transactionConfirmed: false });
  };

  getBalanceError = (balance: string): string | null => {
    const {
      transactionState: {
        transaction: { value = '0x0', gas = '0x0', gasPrice = '0x0' },
      },
    } = this.props;

    const gasBN = hexToBN(gas);
    const weiTransactionFee = gasBN.mul(hexToBN(gasPrice));
    const valueBN = hexToBN(value);
    const transactionTotalAmountBN = weiTransactionFee.add(valueBN);

    const balanceIsInsufficient = hexToBN(balance).lt(transactionTotalAmountBN);

    return balanceIsInsufficient ? strings('transaction.insufficient') : null;
  };

  onSelectAccount = async (accountAddress: string): Promise<void> => {
    const { accounts } = this.props;
    // If new account doesn't have the asset
    this.setState({
      fromSelectedAddress: accountAddress,
      balanceIsZero: hexToBN(accounts[accountAddress].balance).isZero(),
    });
    this.parseTransactionDataHeader();
  };

  openAccountSelector = (): void => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.ACCOUNT_SELECTOR,
      params: {
        isSelectOnly: true,
        onSelectAccount: this.onSelectAccount,
        checkBalanceError: this.getBalanceError,
      },
    });
  };

  toggleHexDataModal = (): void => {
    const { hexDataModalVisible } = this.state;
    this.setState({ hexDataModalVisible: !hexDataModalVisible });
  };

  updateTransactionStateWithUpdatedNonce = (nonceValue: number): void => {
    this.props.setNonce(nonceValue);
  };

  renderCustomNonceModal = (): React.ReactNode => {
    const { proposedNonce, nonce } = this.props.transaction;
    return (
      <CustomNonceModal
        proposedNonce={proposedNonce}
        nonceValue={nonce}
        close={() => this.toggleConfirmationModal(REVIEW)}
        save={this.updateTransactionStateWithUpdatedNonce}
      />
    );
  };

  handleCopyHex = (): void => {
    const { data } = this.props.transactionState.transaction;
    ClipboardManager.setString(data || '');
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transaction.hex_data_copied') },
    });
  };

  renderHexDataModal = (): React.ReactNode => {
    const { hexDataModalVisible } = this.state;
    const { data } = this.props.transactionState.transaction;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    return (
      <Modal
        isVisible={hexDataModalVisible}
        onBackdropPress={this.toggleHexDataModal}
        onBackButtonPress={this.toggleHexDataModal}
        onSwipeComplete={this.toggleHexDataModal}
        swipeDirection={'down'}
        propagateSwipe
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
      >
        <View style={styles.hexDataWrapper}>
          <TouchableOpacity
            style={styles.hexDataClose}
            onPress={this.toggleHexDataModal}
          >
            <IonicIcon
              name={'close'}
              size={28}
              color={colors.text.default}
            />
          </TouchableOpacity>
          <View style={styles.qrCode}>
            <Text style={styles.addressTitle}>
              {strings('transaction.hex_data')}
            </Text>
            <TouchableOpacity
              disabled={!data}
              activeOpacity={0.8}
              onPress={this.handleCopyHex}
            >
              <Text style={styles.hexDataText}>
                {data || strings('unit.empty_data')}
              </Text>
            </TouchableOpacity>
          </View>
          <GlobalAlert />
        </View>
      </Modal>
    );
  };

  buyEth = (): void => {
    const { navigation } = this.props;
    try {
      navigation.navigate(...createBuyNavigationDetails());
    } catch (error) {
      Logger.error(error as Error, 'Navigation: Error when navigating to buy ETH.');
    }

    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  };

  goToFaucet = (): void => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS],
        timestamp: Date.now(),
      });
    });
  };

  onUpdatingValuesStart = (): void => {
    this.setState({ isAnimating: true });
  };
  onUpdatingValuesEnd = (): void => {
    this.setState({ isAnimating: false });
  };

  updateTransactionState = (gas: EIP1559GasTransaction): void => {
    this.setState({
      EIP1559GasTransaction: gas,
      legacyGasTransaction: gas,
    });
  };

  onGasChanged = (gasValue: string): void => {
    this.setState({ gasSelected: gasValue });
  };

  onGasCanceled = (gasValue: string): void => {
    this.setState({
      stopUpdateGas: false,
      gasSelectedTemp: gasValue,
      closeModal: true,
    });
  };

  updateGasState = ({ gasTxn, gasObj, gasSelect, txnType }: { gasTxn: EIP1559GasTransaction | LegacyGasTransaction; gasObj: GasObject; gasSelect: string; txnType?: boolean }): void => {
    this.setState({
      gasSelectedTemp: gasSelect,
      gasSelected: gasSelect,
      closeModal: true,
      ...(txnType
        ? {
            legacyGasTransaction: gasTxn as LegacyGasTransaction,
            legacyGasObject: gasObj,
            advancedGasInserted: !gasSelect,
            stopUpdateGas: false,
          }
        : {
            EIP1559GasTransaction: gasTxn as EIP1559GasTransaction,
            EIP1559GasObject: gasObj,
          }),
    });
  };

  onContactUsClicked = (): void => {
    const { transaction } = this.props;
    const analyticsParams = {
      ...this.getAnalyticsParams(),
      ...getBlockaidTransactionMetricsParams(transaction),
      external_link_clicked: 'security_alert_support_link',
    };
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  getConfirmButtonStyles(): Record<string, unknown> {
    const { securityAlertResponse } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    let confirmButtonStyle = {};
    if (securityAlertResponse) {
      if (securityAlertResponse?.result_type === ResultType.Malicious) {
        confirmButtonStyle = styles.confirmButtonError;
      } else if (securityAlertResponse?.result_type === ResultType.Warning) {
        confirmButtonStyle = styles.confirmButtonWarning;
      }
    }
    return confirmButtonStyle;
  }

  async persistTransactionParameters(transactionParams: Record<string, unknown>): Promise<void> {
    const { TransactionController } = Engine.context;
    const { transactionMeta } = this.state;
    const { id: transactionId } = transactionMeta as { id?: string };

    const controllerTransactionMeta =
      TransactionController.state.transactions.find(
        (tx: { id: string }) => tx.id === transactionId,
      );

    const updatedTx = {
      ...controllerTransactionMeta,
      txParams: {
        ...transactionParams,
        chainId: (controllerTransactionMeta as { chainId?: string })?.chainId,
      },
    };
    await updateTransaction(updatedTx);
  }

  getTransactionMetrics = (): Record<string, unknown> => {
    const { transactionMeta } = this.state;
    const { confirmationMetricsById } = this.props;
    const { id: transactionId } = transactionMeta as { id?: string };

    return confirmationMetricsById[transactionId || '']?.properties || {};
  };

  render = (): React.ReactNode => {
    const { selectedAsset, paymentRequest } = this.props.transactionState;
    const {
      showHexData,
      showCustomNonce,
      primaryCurrency,
      chainId,
      gasEstimateType,
      isNativeTokenBuySupported,
      shouldUseSmartTransaction,
    } = this.props;
    const { nonce } = this.props.transaction;
    const {
      gasEstimationReady,
      fromSelectedAddress,
      transactionValue = '',
      transactionValueFiat = '',
      errorMessage,
      transactionConfirmed,
      warningGasPriceHigh,
      mode,
      isAnimating,
      animateOnChange,
      multiLayerL1FeeTotal,
      gasSelected,
      EIP1559GasObject,
      EIP1559GasTransaction,
      legacyGasObject,
      transactionMeta,
    } = this.state;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const showFeeMarket =
      !gasEstimateType ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.NONE;
    const isQRHardwareWalletDevice = isQRHardwareAccount(fromSelectedAddress || '');
    const isLedgerAccount = isHardwareAccount(fromSelectedAddress || '', [
      ExtendedKeyringTypes.ledger,
    ]);

    const isTestNetwork = isTestNet(chainId);

    const errorPress = isTestNetwork ? this.goToFaucet : this.buyEth;
    const errorLinkText = isTestNetwork
      ? strings('transaction.go_to_faucet')
      : strings('transaction.token_marketplace');

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={ConfirmViewSelectorsIDs.CONTAINER}
      >
        <AccountFromToInfoCard
          transactionState={this.props.transactionState}
          onPressFromAddressIcon={
            !paymentRequest ? null : this.openAccountSelector
          }
          layout="vertical"
        />
        <ScrollView style={baseStyles.flexGrow} ref={this.setScrollViewRef}>
          {(this.state.transactionMeta as { id?: string })?.id && (
            <>
              <TransactionBlockaidBanner
                transactionId={(this.state.transactionMeta as { id: string }).id}
                style={styles.blockaidBanner}
                onContactUsClicked={this.onContactUsClicked}
              />
              <SmartTransactionsMigrationBanner
                style={styles.smartTransactionsMigrationBanner}
              />
            </>
          )}
          {!(selectedAsset as CollectibleAsset).tokenId ? (
            <View style={styles.amountWrapper}>
              <Text style={styles.textAmountLabel}>
                {strings('transaction.amount')}
              </Text>
              <Text
                style={styles.textAmount}
                testID={TransactionConfirmViewSelectorsIDs.CONFIRM_TXN_AMOUNT}
              >
                {transactionValue}
              </Text>
              {isMainnetByChainId(chainId) && (
                <Text style={styles.textAmountLabel}>
                  {transactionValueFiat}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.amountWrapper}>
              <Text style={styles.textAmountLabel}>
                {strings('transaction.asset')}
              </Text>
              <View style={styles.CollectibleMediaWrapper}>
                <CollectibleMedia
                  small
                  iconStyle={styles.CollectibleMedia}
                  containerStyle={styles.CollectibleMedia}
                  collectible={selectedAsset}
                />
              </View>
              <View>
                <Text style={styles.collectibleName}>{(selectedAsset as CollectibleAsset).name}</Text>
                <Text style={styles.collectibleTokenId}>{`#${renderShortText(
                  (selectedAsset as CollectibleAsset).tokenId,
                  10,
                )}`}</Text>
              </View>
            </View>
          )}
          <TransactionReview
            gasSelected={this.state.gasSelected}
            primaryCurrency={primaryCurrency}
            onEdit={() => this.toggleConfirmationModal(EDIT)}
            onUpdatingValuesStart={this.onUpdatingValuesStart}
            onUpdatingValuesEnd={this.onUpdatingValuesEnd}
            animateOnChange={animateOnChange}
            isAnimating={isAnimating}
            gasEstimationReady={gasEstimationReady}
            chainId={chainId}
            gasObject={EIP1559GasObject}
            gasObjectLegacy={legacyGasObject}
            updateTransactionState={this.updateTransactionState}
            legacy={!showFeeMarket}
            onlyGas={false}
            multiLayerL1FeeTotal={multiLayerL1FeeTotal}
          />
          {mode === EDIT && (
            <CustomGasModal
              gasSelected={gasSelected}
              animateOnChange={animateOnChange}
              isAnimating={isAnimating}
              legacyGasData={legacyGasObject}
              EIP1559GasData={EIP1559GasObject}
              EIP1559GasTxn={EIP1559GasTransaction}
              onlyGas={false}
              validateAmount={this.validateAmount}
              onGasChanged={this.onGasChanged}
              legacy={!showFeeMarket}
              onGasCanceled={this.onGasCanceled}
              updateGasState={this.updateGasState}
            />
          )}
          {showCustomNonce && !shouldUseSmartTransaction && (
            <CustomNonce
              nonce={nonce}
              onNonceEdit={() => this.toggleConfirmationModal(EDIT_NONCE)}
            />
          )}

          {errorMessage && (
            <View style={styles.errorWrapper}>
              {isTestNetworkWithFaucet(chainId) || isNativeTokenBuySupported ? (
                <TouchableOpacity onPress={errorPress}>
                  <Text style={styles.error}>{errorMessage}</Text>
                  <Text style={[styles.error, styles.underline]}>
                    {errorLinkText}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.error}>{errorMessage}</Text>
              )}
            </View>
          )}
          {!!warningGasPriceHigh && (
            <View style={styles.errorWrapper}>
              <Text style={styles.error}>{warningGasPriceHigh}</Text>
            </View>
          )}

          {this.state.gasSelected === AppConstants.GAS_OPTIONS.LOW && (
            <WarningMessage
              style={styles.actionsWrapper}
              warningMessage={strings('edit_gas_fee_eip1559.low_fee_warning')}
            />
          )}

          <View style={styles.actionsWrapper}>
            {showHexData && (
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={this.toggleHexDataModal}
              >
                <Text style={styles.actionText}>
                  {strings('transaction.hex_data')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <View style={styles.buttonNextWrapper}>
          <StyledButton
            type={'confirm'}
            disabled={
              isEmpty(transactionMeta) ||
              transactionConfirmed ||
              !gasEstimationReady ||
              Boolean(errorMessage) ||
              isAnimating
            }
            containerStyle={[styles.buttonNext, this.getConfirmButtonStyles()]}
            onPress={this.onNext}
            testID={ConfirmViewSelectorsIDs.SEND_BUTTON}
          >
            {transactionConfirmed ? (
              <ActivityIndicator size="small" color={colors.primary.inverse} />
            ) : isQRHardwareWalletDevice ? (
              strings('transaction.confirm_with_qr_hardware')
            ) : isLedgerAccount ? (
              strings('transaction.confirm_with_ledger_hardware')
            ) : (
              strings('transaction.send')
            )}
          </StyledButton>
        </View>
        {mode === EDIT_NONCE && this.renderCustomNonceModal()}
        {this.renderHexDataModal()}
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
    contractExchangeRates: selectContractExchangeRatesByChainId(state, chainId),
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
    confirmationMetricsById: selectConfirmationMetrics(state),
    transactionMetadata: selectCurrentTransactionMetadata(state),
    securityAlertResponse: selectCurrentTransactionSecurityAlertResponse(state),
    maxValueMode: state.transaction.maxValueMode,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  prepareTransaction: (transaction: Record<string, unknown>) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionId: (transactionId: string) =>
    dispatch(setTransactionId(transactionId)),
  setNonce: (nonce: number) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: number) => dispatch(setProposedNonce(nonce)),
  removeFavoriteCollectible: (selectedAddress: string | undefined, chainId: string, collectible: TokenAsset | CollectibleAsset) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  showAlert: (config: { isVisible: boolean; autodismiss: number; content: string; data: { msg: string } }) => dispatch(showAlert(config)),
  updateConfirmationMetric: ({ id, params }: { id: string; params: { properties: Record<string, unknown> } }) =>
    dispatch(updateConfirmationMetric({ id, params })),
  setTransactionValue: (value: string) => dispatch(setTransactionValue(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Confirm));
