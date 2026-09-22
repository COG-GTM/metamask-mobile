import React, { PureComponent } from 'react';
import type { Theme } from '@metamask/design-tokens';
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
import PropTypes from 'prop-types';
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
import {
  WalletDevice,
  type TransactionMeta,
} from '@metamask/transaction-controller';
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
import type { JsonMap } from '../../../../../../core/Analytics/MetaMetrics.types';
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
  // Pending updated multichain UX to specify the send chain.
  // eslint-disable-next-line no-restricted-syntax
  selectNetworkClientId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import { updateTransactionToMaxValue } from './utils';
import SmartTransactionsMigrationBanner from '../../components/SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { isNativeToken } from '../../../utils/generic';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../../../../reducers';
import type { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';

const EDIT = 'edit';
const EDIT_NONCE = 'edit_nonce';
const REVIEW = 'review';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval>;

interface ConfirmAsset {
  address?: string;
  tokenId?: string;
  name?: string;
  symbol?: string;
  isETH?: boolean;
  decimals?: number;
  image?: string;
}

type ConfirmTransaction = Omit<
  Partial<TransactionMeta>,
  'chainId' | 'txParams' | 'error'
> & {
  from: string;
  to?: string;
  transactionTo?: string;
  transactionValue?: string;
  value: string;
  amount?: string;
  data: string;
  hex_data?: string;
  chainId: string;
  networkClientId?: string;
  networkId?: string;
  origin?: string;
  id?: string;
  nonce?: string | number;
  proposedNonce?: string | number;
  transaction?: object;
  selectedAsset: ConfirmAsset;
  asset?: ConfirmAsset;
  paymentRequest?: boolean;
  maxValueMode?: boolean;
  token_marketplace?: string;
  invalid_amount?: string;
  gas?: string;
  gasPrice?: string;
};

interface ConfirmTransactionState {
  transaction: ConfirmTransaction;
  selectedAsset: ConfirmAsset;
  transactionTo?: string;
  assetType?: string;
  transactionToName?: string;
  transactionFromName?: string;
  paymentRequest?: boolean;
  maxValueMode?: boolean;
}

interface GasState {
  gasFeeMaxHex?: string;
  totalMaxHex?: string;
  error?: string;
  gas?: string;
  gasPrice?: string;
  suggestedGasLimit?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  legacyGasLimit?: string;
  suggestedGasPrice?: string;
}

interface ConfirmProps extends IWithMetricsAwarenessProps {
  navigation: NavigationProp<ParamListBase>;
  route: { params?: Record<string, string>; key: string; name: string };
  accounts: Record<string, { balance: string }>;
  contractBalances: Record<string, string>;
  ticker?: string;
  transactionState: ConfirmTransactionState;
  transaction: ConfirmTransaction;
  conversionRate?: number;
  currentCurrency?: string;
  contractExchangeRates: Record<string, { price: number }>;
  prepareTransaction: (transaction: object) => void;
  chainId: string;
  networkClientId: string;
  globalNetworkClientId: string;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  providerType?: string;
  selectedAsset: ConfirmAsset;
  resetTransaction: () => void;
  primaryCurrency?: string;
  setNonce: (nonce: string | number) => void;
  setProposedNonce: (nonce: string | number) => void;
  gasFeeEstimates: object;
  gasEstimateType: string;
  isPaymentRequest?: boolean;
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: object;
  }) => void;
  isNativeTokenBuySupported?: boolean;
  setTransactionId: (id: string) => void;
  shouldUseSmartTransaction?: boolean;
  confirmationMetricsById: Record<string, { properties?: JsonMap }>;
  transactionMetadata: Partial<TransactionMeta>;
  updateConfirmationMetric: (params: object) => void;
  securityAlertResponse: SecurityAlertResponse;
  maxValueMode?: boolean;
  setTransactionValue: (value: string) => void;
}

interface SecurityAlertResponse {
  result_type?: string;
}

type ConfirmOwnProps = Pick<ConfirmProps, 'navigation' | 'route' | 'metrics'>;

type ConnectedConfirmProps = ConfirmOwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

interface ConfirmState {
  gasEstimationReady: boolean;
  fromSelectedAddress: string;
  hexDataModalVisible: boolean;
  warningGasPriceHigh?: string;
  ready: boolean;
  transactionValue?: string;
  transactionValueFiat?: string;
  errorMessage?: string;
  mode: typeof EDIT | typeof EDIT_NONCE | typeof REVIEW;
  gasSelected: string;
  stopUpdateGas: boolean;
  advancedGasInserted: boolean;
  EIP1559GasTransaction: GasState;
  EIP1559GasObject: GasState;
  legacyGasObject: GasState;
  legacyGasTransaction: GasState;
  multiLayerL1FeeTotal: string;
  result: object;
  transactionMeta: Partial<TransactionMeta>;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  pollToken?: string;
  transactionConfirmed: boolean;
  isAnimating?: boolean;
  animateOnChange?: boolean;
  gasSelectedTemp?: string;
  closeModal?: boolean;
  balanceIsZero?: boolean;
  gasFeeMaxHex?: string;
}

interface LegacyTransactionReviewProps {
  gasSelected: string;
  primaryCurrency?: string;
  onEdit: () => void;
  onUpdatingValuesStart: () => void;
  onUpdatingValuesEnd: () => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  gasEstimationReady: boolean;
  chainId: string;
  gasObject: GasState;
  gasObjectLegacy: GasState;
  updateTransactionState: (gas: GasState) => void;
  legacy: boolean;
  onlyGas: boolean;
  multiLayerL1FeeTotal: string;
}

interface LegacyCustomGasProps {
  gasSelected: string;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  legacyGasData: GasState;
  EIP1559GasData: GasState;
  EIP1559GasTxn: GasState;
  onlyGas: boolean;
  validateAmount: (params: {
    transaction: ConfirmTransaction;
  }) => string | null;
  onGasChanged: (value: string) => void;
  legacy: boolean;
  onGasCanceled: (value: string) => void;
  updateGasState: (params: {
    gasTxn: GasState;
    gasObj: GasState;
    gasSelect: string;
    txnType: boolean;
  }) => void;
}

interface LegacyCustomNonceProps {
  nonce?: string | number;
  onNonceEdit: () => void;
}

// These children remain JavaScript/JSX on main and have declaration-inferred props.
const RenderedTransactionReview =
  TransactionReview as unknown as React.ComponentType<LegacyTransactionReviewProps>;
const RenderedCustomGasModal =
  CustomGasModal as unknown as React.ComponentType<LegacyCustomGasProps>;
const RenderedCustomNonce =
  CustomNonce as unknown as React.ComponentType<LegacyCustomNonceProps>;
const RenderedAccountFromToInfoCard =
  AccountFromToInfoCard as unknown as React.ComponentType<{
    transactionState: ConfirmTransactionState;
    onPressFromAddressIcon?: (() => void) | null;
    layout: string;
  }>;
const RenderedCollectibleMedia =
  CollectibleMedia as unknown as React.ComponentType<{
    collectible: ConfirmAsset;
    small?: boolean;
    iconStyle?: object;
    containerStyle?: object;
  }>;

const getBlockaidMetrics = (transaction: ConfirmTransaction) =>
  (getBlockaidTransactionMetricsParams as unknown as (value: object) => object)(
    transaction,
  );

const stopGasPollingWithoutToken = () =>
  (stopGasPolling as unknown as () => void)();
const createLedgerModalDetails =
  createLedgerTransactionModalNavDetails as unknown as (
    params: object,
  ) => [string, object];

/**
 * View that wraps the wraps the "Send" screen
 */
class Confirm extends PureComponent<ConnectedConfirmProps, ConfirmState> {
  static propTypes = {
    /**
     * Object that represents the navigator
     */
    navigation: PropTypes.object,
    /**
     * Object that contains navigation props
     */
    route: PropTypes.object,
    /**
     * Map of accounts to information objects including balances
     */
    accounts: PropTypes.object,
    /**
     * Object containing token balances in the format address => balance
     */
    contractBalances: PropTypes.object,
    /**
     * Current provider ticker
     */
    ticker: PropTypes.string,
    /**
     * Current transaction state
     */
    transactionState: PropTypes.object,
    /**
     * Normalized transaction state
     */
    transaction: PropTypes.object.isRequired,
    /**
     * ETH to current currency conversion rate
     */
    conversionRate: PropTypes.number,
    /**
     * Currency code of the currently-active currency
     */
    currentCurrency: PropTypes.string,
    /**
     * Object containing token exchange rates in the format address => exchangeRate
     */
    contractExchangeRates: PropTypes.object,
    /**
     * Set transaction object to be sent
     */
    prepareTransaction: PropTypes.func,
    /**
     * Chain Id
     */
    chainId: PropTypes.string,
    /**
     * ID of the associated network client
     */
    networkClientId: PropTypes.string,
    /**
     * ID of the global network client
     */
    globalNetworkClientId: PropTypes.string,
    /**
     * Indicates whether hex data should be shown in transaction editor
     */
    showHexData: PropTypes.bool,
    /**
     * Indicates whether custom nonce should be shown in transaction editor
     */
    showCustomNonce: PropTypes.bool,
    /**
     * Network provider type as mainnet
     */
    providerType: PropTypes.string,
    /**
     * Selected asset from current transaction state
     */
    selectedAsset: PropTypes.object,
    /**
     * Resets transaction state
     */
    resetTransaction: PropTypes.func,
    /**
     * ETH or fiat, depending on user setting
     */
    primaryCurrency: PropTypes.string,
    /**
     * Set transaction nonce
     */
    setNonce: PropTypes.func,
    /**
     * Set proposed nonce (from network)
     */
    setProposedNonce: PropTypes.func,
    /**
     * Gas fee estimates returned by the gas fee controller
     */
    gasFeeEstimates: PropTypes.object,
    /**
     * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
     */
    gasEstimateType: PropTypes.string,
    /**
     * Indicates whether the current transaction is a deep link transaction
     */
    isPaymentRequest: PropTypes.bool,
    /**
     * Triggers global alert
     */
    showAlert: PropTypes.func,
    /**
     * Boolean that indicates if the network supports buy
     */
    isNativeTokenBuySupported: PropTypes.bool,
    /**
     * Metrics injected by withMetricsAwareness HOC
     */
    metrics: PropTypes.object,
    /**
     * Set transaction ID
     */
    setTransactionId: PropTypes.func,
    /**
     * Boolean that indicates if smart transaction should be used
     */
    shouldUseSmartTransaction: PropTypes.bool,
    /**
     * Object containing confirmation metrics by id
     */
    confirmationMetricsById: PropTypes.object,
    /**
     * Transaction metadata from the transaction controller
     */
    transactionMetadata: PropTypes.object,
    /**
     * Update confirmation metrics
     */
    updateConfirmationMetric: PropTypes.func,
    /**
     * Object containing blockaid validation response for confirmation
     */
    securityAlertResponse: PropTypes.object,
    /**
     * Boolean that indicates if the max value mode is enabled
     */
    maxValueMode: PropTypes.bool,
    /**
     * Function that sets the transaction value
     */
    setTransactionValue: PropTypes.func,
  };

  static contextType = ThemeContext;

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
    transactionConfirmed: false,
  };

  originIsWalletConnect = this.props.transaction.origin?.startsWith(
    WALLET_CONNECT_ORIGIN,
  );

  originIsMMSDKRemoteConn = this.props.transaction.origin?.startsWith(
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
  );

  setNetworkNonce = async () => {
    const {
      globalNetworkClientId,
      setNonce: setNonceAction,
      setProposedNonce: setProposedNonceAction,
      transaction,
    } = this.props;
    const proposedNonce = await getNetworkNonce(
      transaction,
      globalNetworkClientId,
    );
    setNonceAction(proposedNonce);
    setProposedNonceAction(proposedNonce);
  };

  getAnalyticsParams = (transactionMeta?: Partial<TransactionMeta>) => {
    const {
      selectedAsset,
      gasEstimateType,
      chainId,
      shouldUseSmartTransaction,
    } = this.props;
    const { gasSelected, fromSelectedAddress } = this.state;

    // Define baseParams with safe fallback values
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
      const { SmartTransactionsController } = Engine.context;

      const smartTransactionMetricsProperties = (
        getSmartTransactionMetricsProperties as unknown as (
          controller: object,
          meta?: Partial<TransactionMeta>,
        ) => object
      )(SmartTransactionsController, transactionMeta);

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

  updateNavBar = () => {
    const {
      navigation,
      route,
      resetTransaction: resetTransactionAction,
      transaction,
    } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    navigation.setOptions(
      (getSendFlowTitle as unknown as (...args: unknown[]) => object)(
        'send.confirm',
        navigation,
        route,
        colors,
        resetTransactionAction,
        transaction,
      ),
    );
  };

  componentWillUnmount = async () => {
    const {
      contractBalances,
      transactionState: { selectedAsset },
    } = this.props;

    const { transactionMeta } = this.state;
    const { TokensController } = Engine.context;
    await (stopGasPolling as unknown as (token?: string) => Promise<void>)(
      this.state.pollToken,
    );
    clearInterval(intervalIdForEstimatedL1Fee);

    (Engine.rejectPendingApproval as unknown as (...args: unknown[]) => void)(
      transactionMeta.id as string,
      undefined,
      {
        ignoreMissing: true,
        logErrors: false,
      },
    );

    /**
     * Remove token that was added to the account temporarily
     * Ref.: https://github.com/MetaMask/metamask-mobile/pull/3989#issuecomment-1367558394
     */
    if (
      isNativeToken(selectedAsset as Parameters<typeof isNativeToken>[0]) ||
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

  fetchEstimatedL1Fee = async () => {
    const { transaction, chainId } = this.props;
    if (!transaction?.transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker()
          .provider as ConstructorParameters<typeof Eth>[0],
      );
      const result = await (
        fetchEstimatedMultiLayerL1Fee as unknown as (
          client: unknown,
          params: object,
        ) => Promise<string>
      )(eth, {
        txParams: transaction.transaction,
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

  componentDidMount = async () => {
    const {
      chainId,
      globalNetworkClientId,
      showCustomNonce,
      navigation,
      providerType,
      isPaymentRequest,
      setTransactionId: setTransactionIdAction,
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
        .addProperties(this.getAnalyticsParams() as JsonMap)
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

    let result: object, transactionMeta: Partial<TransactionMeta>;
    try {
      ({ result, transactionMeta } = await TransactionController.addTransaction(
        transactionParams as Parameters<
          typeof TransactionController.addTransaction
        >[0],
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
        (error && (error as Error).message) as string | undefined,
        [{ text: 'OK' }],
      );
      return;
    }

    setTransactionIdAction(transactionMeta.id as string);

    this.setState({ result, transactionMeta });

    // start validate ppom
    const id = transactionMeta.id;
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

  componentDidUpdate = (
    prevProps: ConnectedConfirmProps,
    prevState: ConfirmState,
  ) => {
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
    const { id: transactionId } = transactionMeta;

    this.updateNavBar();

    const transaction = this.prepareTransactionToSend();
    const { EIP1559GasTransaction, legacyGasTransaction } = this.state;

    let error;

    if (this.state?.closeModal) this.toggleConfirmationModal(REVIEW);

    const { errorMessage, fromSelectedAddress } = this.state;
    const valueChanged = prevProps.transactionState.transaction.value !== value;
    const fromAddressChanged =
      prevState.fromSelectedAddress !== fromSelectedAddress;
    const previousContractBalance =
      prevProps.contractBalances[
        selectedAsset.address as keyof typeof prevProps.contractBalances
      ];
    const newContractBalance =
      contractBalances[selectedAsset.address as keyof typeof contractBalances];
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
      (this as unknown as { scrollView: ScrollView }).scrollView.scrollToEnd({
        animated: true,
      });
    }

    if (
      transactionId &&
      maxValueMode &&
      selectedAsset.isETH &&
      !isEmpty(gasFeeEstimates) &&
      (haveGasFeeMaxNativeChanged ||
        (this.state.hasHandledFirstGasUpdate && !prevState.transactionMeta?.id))
    ) {
      (updateTransactionToMaxValue as unknown as (params: object) => void)({
        transactionId,
        isEIP1559Transaction,
        EIP1559GasTransaction: EIP1559GasTransaction as object,
        legacyGasTransaction: legacyGasTransaction as object,
        accountBalance: accounts[from as string].balance,
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
          // eslint-disable-next-line react/no-did-update-set-state
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
          // eslint-disable-next-line react/no-did-update-set-state
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

  setScrollViewRef = (ref: ScrollView) => {
    (this as unknown as { scrollView: ScrollView }).scrollView = ref;
  };

  toggleConfirmationModal = (
    MODE: typeof EDIT | typeof EDIT_NONCE | typeof REVIEW,
  ) => {
    this.onModeChange(MODE);
    this.setState({ closeModal: false });
  };

  onModeChange = (mode: typeof EDIT | typeof EDIT_NONCE | typeof REVIEW) => {
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

  getGasLimit = async () => {
    const {
      prepareTransaction: prepareTransactionAction,
      transactionState: { transaction },
    } = this.props;
    const { networkClientId } = this.props;
    const estimation = await (
      getGasLimit as unknown as (
        transaction: object,
        useEip1559: boolean,
        clientId: string,
      ) => Promise<object>
    )(transaction, true, networkClientId);
    prepareTransactionAction({ ...transaction, ...estimation });
  };

  parseTransactionDataHeader = async () => {
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

    let transactionValue, transactionValueFiat;
    const valueBN = hexToBN(value);
    const symbol = ticker ?? selectedAsset?.symbol;
    const parsedTicker = getTicker(symbol as string);

    if (isNativeToken(selectedAsset as Parameters<typeof isNativeToken>[0])) {
      transactionValue = `${renderFromWei(value)} ${parsedTicker}`;
      transactionValueFiat = weiToFiat(
        valueBN,
        conversionRate as number,
        currentCurrency as string,
      );
    } else if (selectedAsset.tokenId) {
      transactionValueFiat = weiToFiat(
        valueBN,
        conversionRate as number,
        currentCurrency as string,
      );
    } else {
      const {
        address,
        symbol: tokenSymbol = 'ERC20',
        decimals,
        image,
        name,
      } = selectedAsset;
      const { TokensController } = Engine.context;

      if (!contractBalances[address as keyof typeof contractBalances]) {
        await TokensController.addToken({
          address: address as string,
          symbol: tokenSymbol,
          decimals: decimals as number,
          image,
          name,
          networkClientId: this.props.networkClientId,
        });
      }

      const [, , rawAmount] = decodeTransferData('transfer', data as string);
      const rawAmountString = parseInt(rawAmount, 16).toLocaleString(
        'fullwide',
        { useGrouping: false },
      );
      const transferValue = renderFromTokenMinimalUnit(
        rawAmountString,
        decimals as number,
      );
      transactionValue = `${transferValue} ${tokenSymbol}`;
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[address as keyof typeof contractExchangeRates]
            ?.price
        : undefined;
      transactionValueFiat =
        balanceToFiat(
          transferValue,
          conversionRate,
          exchangeRate,
          currentCurrency as string,
        ) || `0 ${currentCurrency}`;
    }
    this.setState({
      transactionValue,
      transactionValueFiat,
    });
  };

  prepareTransactionToSend = () => {
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
      gasEstimateType: gasEstimateType as Parameters<
        typeof buildTransactionParams
      >[0]['gasEstimateType'],
      showCustomNonce: showCustomNonce as boolean,
      transaction,
    }) as unknown as ConfirmTransaction;
  };

  /**
   * Removes collectible in case an ERC721 asset is being sent, when not in mainnet
   */
  checkRemoveCollectible = () => {
    const {
      transactionState: { selectedAsset, assetType },
      chainId,
    } = this.props;
    const { fromSelectedAddress } = this.state;
    if (assetType === 'ERC721' && chainId !== ChainId.mainnet) {
      const { NftController } = Engine.context;
      removeFavoriteCollectible(fromSelectedAddress, chainId, selectedAsset);
      NftController.removeNft(
        selectedAsset.address as string,
        selectedAsset.tokenId as string,
      );
    }
  };

  /**
   * Validates transaction balances
   * @returns - Whether there is an error with the amount
   */
  validateAmount = ({ transaction }: { transaction: ConfirmTransaction }) => {
    const {
      accounts,
      contractBalances,
      selectedAsset,
      ticker,
      transactionState: {
        transaction: { value },
      },
      updateConfirmationMetric: updateConfirmationMetricAction,
    } = this.props;
    const { EIP1559GasTransaction, legacyGasTransaction, transactionMeta } =
      this.state;
    const { id: transactionId } = transactionMeta;
    const isEIP1559Transaction =
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const { gasFeeMaxHex } = isEIP1559Transaction
      ? EIP1559GasTransaction
      : legacyGasTransaction;

    const transactionFeeMax = hexToBN(gasFeeMaxHex as string);
    const transactionValueHex = hexToBN(value as string);

    const totalTransactionValue = transactionValueHex.add(transactionFeeMax);

    const selectedAddress = transaction?.from;
    const weiBalance = hexToBN(accounts[selectedAddress as string].balance);

    if (!isDecimal(value)) {
      return strings('transaction.invalid_amount');
    }

    const insufficientBalanceMessage = validateSufficientBalance(
      weiBalance.toString(),
      totalTransactionValue.toString(),
      ticker as string,
    );

    if (insufficientBalanceMessage) {
      updateConfirmationMetricAction({
        id: transactionId,
        params: {
          properties: {
            alert_triggered: ['insufficient_funds_for_gas'],
          },
        },
      });
    }

    if (
      isNativeToken(selectedAsset as Parameters<typeof isNativeToken>[0]) ||
      selectedAsset.tokenId
    ) {
      return insufficientBalanceMessage;
    }

    const insufficientTokenBalanceMessage = validateSufficientTokenBalance(
      transaction as Parameters<typeof validateSufficientTokenBalance>[0],
      contractBalances,
      selectedAsset as unknown as Parameters<
        typeof validateSufficientTokenBalance
      >[2],
    );

    return insufficientBalanceMessage || insufficientTokenBalanceMessage;
  };

  setError = (errorMessage?: string | null) => {
    this.setState({ errorMessage: errorMessage as string | undefined }, () => {
      if (errorMessage) {
        (this as unknown as { scrollView: ScrollView }).scrollView.scrollToEnd({
          animated: true,
        });
      }
    });
  };

  onLedgerConfirmation = async (
    approve: boolean,
    result: object,
    transactionMeta: Partial<TransactionMeta>,
    assetType: string,
    gaParams: object,
  ) => {
    const { navigation } = this.props;
    // Manual cancel from UI or rejected from ledger device.
    try {
      if (approve) {
        await new Promise((resolve) => resolve(result));

        if (transactionMeta.error) {
          throw transactionMeta.error;
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
              .addProperties(gaParams as JsonMap)
              .build(),
          );
          stopGasPollingWithoutToken();
          resetTransaction();
        });
      }
    } finally {
      // Error handling derived to LedgerConfirmationModal component
      navigation &&
        (
          navigation.dangerouslyGetParent() as unknown as {
            popToTop: () => void;
          }
        )?.popToTop();
    }
  };

  onNext = async () => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      transactionState: { assetType },
      navigation,
      resetTransaction: resetTransactionAction,
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
            resetTransactionAction();
            (
              navigation?.dangerouslyGetParent() as unknown as {
                pop: () => void;
              }
            )?.pop();
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

      const isLedgerAccount = isHardwareAccount(transaction.from, [
        ExtendedKeyringTypes.ledger,
      ]);

      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionConfirmed: false });
        // Approve transaction for ledger is called in the Confirmation Flow (modals) after user prompt
        this.props.navigation.navigate(
          ...createLedgerModalDetails({
            transactionId: transactionMeta.id as string,
            deviceId,
            onConfirmationComplete: async (approve: boolean) =>
              await this.onLedgerConfirmation(
                approve,
                result,
                transactionMeta,
                assetType as string,
                {
                  ...this.getAnalyticsParams(),
                  ...getBlockaidMetrics(transaction),
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
        await ApprovalController.accept(
          transactionMeta.id as string,
          undefined,
          {
            waitForResult: false,
          },
        );
        navigation.navigate(Routes.TRANSACTIONS_VIEW);
      } else {
        await ApprovalController.accept(
          transactionMeta.id as string,
          undefined,
          {
            waitForResult: true,
          },
        );
      }

      await new Promise((resolve) => resolve(result));

      if (transactionMeta.error) {
        throw transactionMeta.error;
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
              ...getBlockaidMetrics(transaction),
              ...this.getTransactionMetrics(),
            } as JsonMap)
            .build(),
        );
        stopGasPollingWithoutToken();
        resetTransactionAction();

        if (!shouldUseSmartTransaction) {
          navigation.navigate(Routes.TRANSACTIONS_VIEW);
        }
      });
    } catch (error) {
      const caughtError = error as Error;
      if (
        !caughtError.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !caughtError.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          caughtError.message,
          [{ text: 'OK' }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Confirm)',
        );
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

  getBalanceError = (balance: string) => {
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

  onSelectAccount = async (accountAddress: string) => {
    const { accounts } = this.props;
    // If new account doesn't have the asset
    this.setState({
      fromSelectedAddress: accountAddress,
      balanceIsZero: hexToBN(accounts[accountAddress].balance).isZero(),
    });
    this.parseTransactionDataHeader();
  };

  openAccountSelector = () => {
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

  toggleHexDataModal = () => {
    const { hexDataModalVisible } = this.state;
    this.setState({ hexDataModalVisible: !hexDataModalVisible });
  };

  updateTransactionStateWithUpdatedNonce = (nonceValue: number) => {
    this.props.setNonce(nonceValue);
  };

  renderCustomNonceModal = () => {
    const { proposedNonce, nonce } = this.props.transaction;
    return (
      <CustomNonceModal
        proposedNonce={proposedNonce as number}
        nonceValue={nonce as number}
        close={() => this.toggleConfirmationModal(REVIEW)}
        save={this.updateTransactionStateWithUpdatedNonce}
      />
    );
  };

  handleCopyHex = () => {
    const { data } = this.props.transactionState.transaction;
    ClipboardManager.setString(data);
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transaction.hex_data_copied') },
    });
  };

  renderHexDataModal = () => {
    const { hexDataModalVisible } = this.state;
    const { data } = this.props.transactionState.transaction;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors) as ReturnType<typeof createStyles> & {
      blockaidBanner: object;
    };
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
            <IonicIcon name={'close'} size={28} color={colors.text.default} />
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

  buyEth = () => {
    const { navigation } = this.props;
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

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: TESTNET_FAUCETS[chainId as keyof typeof TESTNET_FAUCETS],
        timestamp: Date.now(),
      });
    });
  };

  onUpdatingValuesStart = () => {
    this.setState({ isAnimating: true });
  };
  onUpdatingValuesEnd = () => {
    this.setState({ isAnimating: false });
  };

  updateTransactionState = (gas: GasState) => {
    this.setState({
      EIP1559GasTransaction: gas,
      legacyGasTransaction: gas,
    });
  };

  onGasChanged = (gasValue: string) => {
    this.setState({ gasSelected: gasValue });
  };

  onGasCanceled = (gasValue: string) => {
    this.setState({
      stopUpdateGas: false,
      gasSelectedTemp: gasValue,
      closeModal: true,
    });
  };

  updateGasState = ({
    gasTxn,
    gasObj,
    gasSelect,
    txnType,
  }: {
    gasTxn: GasState;
    gasObj: GasState;
    gasSelect: string;
    txnType: boolean;
  }) => {
    this.setState({
      gasSelectedTemp: gasSelect,
      gasSelected: gasSelect,
      closeModal: true,
      ...(txnType
        ? {
            legacyGasTransaction: gasTxn,
            legacyGasObject: gasObj,
            advancedGasInserted: !gasSelect,
            stopUpdateGas: false,
          }
        : {
            EIP1559GasTransaction: gasTxn,
            EIP1559GasObject: gasObj,
          }),
    } as unknown as Pick<ConfirmState, 'gasSelectedTemp' | 'gasSelected' | 'closeModal' | 'legacyGasTransaction' | 'legacyGasObject' | 'advancedGasInserted' | 'stopUpdateGas' | 'EIP1559GasTransaction' | 'EIP1559GasObject'>);
  };

  onContactUsClicked = () => {
    const { transaction } = this.props;
    const analyticsParams = {
      ...this.getAnalyticsParams(),
      ...getBlockaidMetrics(transaction),
      external_link_clicked: 'security_alert_support_link',
    };
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams as JsonMap)
        .build(),
    );
  };

  getConfirmButtonStyles() {
    const { securityAlertResponse } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors) as ReturnType<typeof createStyles> & {
      blockaidBanner: object;
    };

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

  async persistTransactionParameters(transactionParams: object) {
    const { TransactionController } = Engine.context;
    const { transactionMeta } = this.state;
    const { id: transactionId } = transactionMeta;

    const controllerTransactionMeta =
      TransactionController.state.transactions.find(
        (tx) => tx.id === transactionId,
      );

    const updatedTx = {
      ...controllerTransactionMeta,
      txParams: {
        ...transactionParams,
        chainId: (controllerTransactionMeta as TransactionMeta).chainId,
      },
    };
    await (
      updateTransaction as unknown as (transaction: object) => Promise<void>
    )(updatedTx);
  }

  getTransactionMetrics = () => {
    const { transactionMeta } = this.state;
    const { confirmationMetricsById } = this.props;
    const { id: transactionId } = transactionMeta;

    return confirmationMetricsById[transactionId as string]?.properties || {};
  };

  render = () => {
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors) as ReturnType<typeof createStyles> & {
      blockaidBanner: object;
    };
    const showFeeMarket =
      !gasEstimateType ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.NONE;
    const isQRHardwareWalletDevice = isQRHardwareAccount(fromSelectedAddress);
    const isLedgerAccount = isHardwareAccount(fromSelectedAddress, [
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
        <RenderedAccountFromToInfoCard
          transactionState={this.props.transactionState}
          onPressFromAddressIcon={
            !paymentRequest ? null : this.openAccountSelector
          }
          layout="vertical"
        />
        <ScrollView style={baseStyles.flexGrow} ref={this.setScrollViewRef}>
          {this.state.transactionMeta?.id && (
            <>
              <TransactionBlockaidBanner
                transactionId={this.state.transactionMeta.id}
                style={styles.blockaidBanner}
                onContactUsClicked={this.onContactUsClicked}
              />
              <SmartTransactionsMigrationBanner
                style={styles.smartTransactionsMigrationBanner}
              />
            </>
          )}
          {!selectedAsset.tokenId ? (
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
                <RenderedCollectibleMedia
                  small
                  iconStyle={styles.CollectibleMedia}
                  containerStyle={styles.CollectibleMedia}
                  collectible={selectedAsset}
                />
              </View>
              <View>
                <Text style={styles.collectibleName}>{selectedAsset.name}</Text>
                <Text style={styles.collectibleTokenId}>{`#${renderShortText(
                  selectedAsset.tokenId,
                  10,
                )}`}</Text>
              </View>
            </View>
          )}
          <RenderedTransactionReview
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
            <RenderedCustomGasModal
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
            <RenderedCustomNonce
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
  prepareTransaction: (transaction: object) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionId: (transactionId: string) =>
    dispatch(
      setTransactionId(
        transactionId as unknown as Parameters<typeof setTransactionId>[0],
      ),
    ),
  setNonce: (nonce: number | string) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: number | string) =>
    dispatch(setProposedNonce(nonce)),
  removeFavoriteCollectible: (
    selectedAddress: string,
    chainId: string,
    collectible: ConfirmAsset,
  ) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: object;
  }) => dispatch(showAlert(config as Parameters<typeof showAlert>[0])),
  updateConfirmationMetric: ({ id, params }: { id?: string; params: object }) =>
    dispatch(
      updateConfirmationMetric({
        id,
        params,
      } as Parameters<typeof updateConfirmationMetric>[0]),
    ),
  setTransactionValue: (value: string) => dispatch(setTransactionValue(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    // Legacy metrics HOC declarations accept only injected props.
    Confirm as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
