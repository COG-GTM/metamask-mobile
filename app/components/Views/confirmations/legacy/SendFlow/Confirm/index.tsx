import React, { ComponentProps, ComponentType, PureComponent } from 'react';
import { baseStyles } from '../../../../../../styles/common';
import {
  InteractionManager,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  ScrollView as ScrollViewType,
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
import {
  TransactionMeta,
  TransactionParams,
  WalletDevice,
} from '@metamask/transaction-controller';
import { ChainId } from '@metamask/controller-utils';
import {
  GAS_ESTIMATE_TYPES,
  GasEstimateType,
} from '@metamask/gas-fee-controller';
import {
  prepareTransaction as prepareTransactionAction,
  resetTransaction as resetTransactionAction,
  setNonce as setNonceAction,
  setProposedNonce as setProposedNonceAction,
  setTransactionId as setTransactionIdAction,
  setTransactionValue as setTransactionValueAction,
} from '../../../../../../actions/transaction';
import { getGasLimit } from '../../../../../../util/custom-gas';
import Engine from '../../../../../../core/Engine';
import Logger from '../../../../../../util/Logger';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import CustomNonceModal from '../components/CustomNonceModal';
import NotificationManager from '../../../../../../core/NotificationManager';
import { strings } from '../../../../../../../locales/i18n';
import CollectibleMediaComponent from '../../../../../UI/CollectibleMedia';
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
import { removeFavoriteCollectible as removeFavoriteCollectibleAction } from '../../../../../../actions/collectibles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountFromToInfoCardComponent from '../../../../../UI/AccountFromToInfoCard';
import TransactionReviewComponent from '../../components/TransactionReview/TransactionReviewEIP1559Update';
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
import { showAlert as showAlertAction } from '../../../../../../actions/alert';
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
import CustomGasModalComponent from './components/CustomGasModal';
import {
  ResultType,
  SecurityAlertResponse,
} from '../../components/BlockaidBanner/BlockaidBanner.types';
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
  updateConfirmationMetric as updateConfirmationMetricAction,
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
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Dispatch } from 'redux';
import { Hex } from '@metamask/utils';
import { RootState } from '../../../../../../reducers';
import { Theme } from '../../../../../../util/theme/models';
import { IWithMetricsAwarenessProps } from '../../../../../hooks/useMetrics/withMetricsAwareness.types';
import { JsonMap } from '../../../../../../core/Analytics/MetaMetrics.types';
import {
  LegacySelectedAsset,
  LegacyTransactionParams,
  LegacyTransactionState,
} from '../../types/legacy-transaction';
import {
  EIP1559GasTransaction as EIP1559GasTransactionData,
  LegacyGasObject,
  LegacyGasTransaction,
} from '../../types/legacy-gas';

const CollectibleMedia = CollectibleMediaComponent as ComponentType<
  Partial<
    Omit<ComponentProps<typeof CollectibleMediaComponent>, 'collectible'>
  > & {
    collectible: LegacySelectedAsset;
    containerStyle?: StyleProp<ViewStyle>;
    iconStyle?: StyleProp<ViewStyle>;
  }
>;

interface LegacyNavigationParent {
  pop: () => void;
  popToTop: () => void;
}

const getLegacyNavigationParent = (navigation: NavigationProp<ParamListBase>) =>
  (
    navigation as unknown as {
      dangerouslyGetParent: () => LegacyNavigationParent | undefined;
    }
  ).dangerouslyGetParent();

type LegacyGasData = EIP1559GasTransactionData & LegacyGasTransaction;

const TransactionReview = TransactionReviewComponent as ComponentType<
  Partial<
    Omit<
      ComponentProps<typeof TransactionReviewComponent>,
      'gasSelected' | 'gasObject' | 'gasObjectLegacy' | 'updateTransactionState'
    >
  > & {
    gasSelected?: string | null;
    gasObject?: Record<string, string | undefined>;
    gasObjectLegacy?: LegacyGasObject;
    multiLayerL1FeeTotal?: string;
    updateTransactionState?: (gas: LegacyGasData) => void;
  }
>;

const CustomGasModal = CustomGasModalComponent as ComponentType<
  Partial<
    Omit<
      ComponentProps<typeof CustomGasModalComponent>,
      | 'EIP1559GasData'
      | 'EIP1559GasTxn'
      | 'gasSelected'
      | 'legacyGasData'
      | 'onGasCanceled'
      | 'onGasChanged'
      | 'updateGasState'
      | 'validateAmount'
    >
  > & {
    EIP1559GasData?: Record<string, string | undefined>;
    EIP1559GasTxn?: EIP1559GasTransactionData;
    gasSelected?: string | null;
    legacyGasData?: LegacyGasObject;
    onGasCanceled?: (gas: string | null) => void;
    onGasChanged?: (gas: string | null) => void;
    updateGasState?: (state: {
      gasTxn: LegacyGasData;
      gasObj: Record<string, string | undefined>;
      gasSelect: string | null;
      txnType?: boolean;
    }) => void;
    validateAmount?: (params: {
      transaction: TransactionParams;
    }) => string | undefined;
  }
>;

const AccountFromToInfoCard = AccountFromToInfoCardComponent as ComponentType<
  Partial<
    Omit<
      ComponentProps<typeof AccountFromToInfoCardComponent>,
      'onPressFromAddressIcon' | 'transactionState'
    >
  > & {
    onPressFromAddressIcon?: (() => void) | null;
    transactionState: LegacyTransactionState;
  }
>;

const isNativeAsset = (asset: LegacySelectedAsset) =>
  isNativeToken(asset as unknown as Parameters<typeof isNativeToken>[0]);

const EDIT = 'edit';
const EDIT_NONCE = 'edit_nonce';
const REVIEW = 'review';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: ReturnType<typeof setInterval> | undefined;

interface ConfirmProps extends IWithMetricsAwarenessProps {
  /**
   * Object that represents the navigator
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Object that contains navigation props
   */
  route?: { params?: Record<string, unknown> };
  /**
   * Map of accounts to information objects including balances
   */
  accounts: Record<string, { balance: string }>;
  /**
   * Object containing token balances in the format address => balance
   */
  contractBalances: Record<string, string>;
  /**
   * Current provider ticker
   */
  ticker?: string;
  /**
   * Current transaction state
   */
  transactionState: LegacyTransactionState;
  /**
   * Normalized transaction state
   */
  transaction: LegacyTransactionState;
  /**
   * ETH to current currency conversion rate
   */
  conversionRate: number;
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: string;
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  contractExchangeRates?: Record<string, { price?: number } | undefined>;
  /**
   * Set transaction object to be sent
   */
  prepareTransaction: (transaction: LegacyTransactionParams) => void;
  /**
   * Chain Id
   */
  chainId: Hex;
  /**
   * ID of the associated network client
   */
  networkClientId: string;
  /**
   * ID of the global network client
   */
  globalNetworkClientId: string;
  /**
   * Indicates whether hex data should be shown in transaction editor
   */
  showHexData?: boolean;
  /**
   * Indicates whether custom nonce should be shown in transaction editor
   */
  showCustomNonce?: boolean;
  /**
   * Network provider type as mainnet
   */
  providerType?: string;
  /**
   * Selected asset from current transaction state
   */
  selectedAsset: LegacySelectedAsset;
  /**
   * Resets transaction state
   */
  resetTransaction: () => void;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * Set transaction nonce
   */
  setNonce: (nonce: number) => void;
  /**
   * Set proposed nonce (from network)
   */
  setProposedNonce: (nonce: number) => void;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: Record<string, unknown>;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: GasEstimateType;
  /**
   * Indicates whether the current transaction is a deep link transaction
   */
  isPaymentRequest?: boolean;
  /**
   * Triggers global alert
   */
  showAlert: (config: Record<string, unknown>) => void;
  /**
   * Boolean that indicates if the network supports buy
   */
  isNativeTokenBuySupported?: boolean;
  /**
   * Set transaction ID
   */
  setTransactionId: (transactionId: string) => void;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
  /**
   * Object containing confirmation metrics by id
   */
  confirmationMetricsById: Record<
    string,
    { properties?: Record<string, unknown> } | undefined
  >;
  /**
   * Transaction metadata from the transaction controller
   */
  transactionMetadata?: TransactionMeta;
  /**
   * Update confirmation metrics
   */
  updateConfirmationMetric: (payload: {
    id: string;
    params: { properties: Record<string, unknown> };
  }) => void;
  /**
   * Object containing blockaid validation response for confirmation
   */
  securityAlertResponse?: SecurityAlertResponse;
  /**
   * Boolean that indicates if the max value mode is enabled
   */
  maxValueMode?: boolean;
  /**
   * Function that sets the transaction value
   */
  setTransactionValue: (value: string) => void;
}

interface ConfirmState {
  gasEstimationReady: boolean;
  fromSelectedAddress?: string;
  hexDataModalVisible: boolean;
  warningGasPriceHigh?: string;
  ready: boolean;
  transactionValue?: string;
  transactionValueFiat?: string;
  errorMessage?: string;
  mode: string;
  gasSelected: string | null;
  gasSelectedTemp?: string | null;
  stopUpdateGas: boolean;
  advancedGasInserted: boolean;
  EIP1559GasTransaction: EIP1559GasTransactionData;
  EIP1559GasObject: Record<string, string | undefined>;
  legacyGasObject: LegacyGasObject;
  legacyGasTransaction: LegacyGasTransaction;
  multiLayerL1FeeTotal: string;
  result: unknown;
  transactionMeta: Partial<TransactionMeta>;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  animateOnChange?: boolean;
  balanceIsZero?: boolean;
  closeModal?: boolean;
  isAnimating?: boolean;
  pollToken?: string;
  transactionConfirmed?: boolean;
}

/**
 * View that wraps the wraps the "Send" screen
 */
class Confirm extends PureComponent<ConfirmProps, ConfirmState> {
  scrollView: ScrollViewType | null = null;

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

  setNetworkNonce = async () => {
    const { globalNetworkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(
      transaction as unknown as Parameters<typeof getNetworkNonce>[0],
      globalNetworkClientId,
    );
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
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
          controller: typeof SmartTransactionsController,
          meta?: Partial<TransactionMeta>,
        ) => Record<string, unknown>
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
    const { navigation, route, resetTransaction, transaction } = this.props;
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
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

    Engine.rejectPendingApproval(
      transactionMeta.id as string,
      undefined as unknown as Error,
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
      isNativeAsset(selectedAsset) ||
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
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction.transaction as TransactionParams,
        chainId,
      });
      this.setState({
        multiLayerL1FeeTotal: result as string,
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

    let result, transactionMeta;
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
        (error as Error | undefined)?.message,
        [{ text: 'OK' }],
      );
      return;
    }

    setTransactionId(transactionMeta.id);

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

  componentDidUpdate = (prevProps: ConfirmProps, prevState: ConfirmState) => {
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
      prevProps.contractBalances[selectedAsset.address as string];
    const newContractBalance =
      contractBalances[selectedAsset.address as string];
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
      selectedAsset.isETH &&
      !isEmpty(gasFeeEstimates) &&
      (haveGasFeeMaxNativeChanged ||
        (this.state.hasHandledFirstGasUpdate && !prevState.transactionMeta?.id))
    ) {
      updateTransactionToMaxValue({
        transactionId,
        isEIP1559Transaction,
        EIP1559GasTransaction: EIP1559GasTransaction as {
          gasFeeMaxHex: string;
        },
        legacyGasTransaction: legacyGasTransaction as { gasFeeMaxHex: string },
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

  setScrollViewRef = (ref: ScrollViewType | null) => {
    this.scrollView = ref;
  };

  toggleConfirmationModal = (MODE: string) => {
    this.onModeChange(MODE);
    this.setState({ closeModal: false });
  };

  onModeChange = (mode: string) => {
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
      prepareTransaction,
      transactionState: { transaction },
    } = this.props;
    const { networkClientId } = this.props;
    const estimation = await getGasLimit(transaction, true, networkClientId);
    prepareTransaction({
      ...transaction,
      ...estimation,
    } as unknown as LegacyTransactionParams);
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
    const valueBN = hexToBN(value as string);
    const symbol = ticker ?? selectedAsset?.symbol;
    const parsedTicker = getTicker(symbol);

    if (isNativeAsset(selectedAsset)) {
      transactionValue = `${renderFromWei(value as string)} ${parsedTicker}`;
      transactionValueFiat = weiToFiat(
        valueBN,
        conversionRate,
        currentCurrency,
      );
    } else if (selectedAsset.tokenId) {
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
      } = selectedAsset;
      const { TokensController } = Engine.context;

      if (!contractBalances[address as string]) {
        await TokensController.addToken({
          address: address as string,
          symbol: assetSymbol,
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
      transactionValue = `${transferValue} ${assetSymbol}`;
      const exchangeRate = contractExchangeRates
        ? contractExchangeRates[address as string]?.price
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
      gasEstimateType,
      showCustomNonce: showCustomNonce as boolean,
      transaction,
    });
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
      removeFavoriteCollectibleAction(
        fromSelectedAddress as string,
        chainId,
        selectedAsset,
      );
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
  validateAmount = ({ transaction }: { transaction: TransactionParams }) => {
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
    const { id: transactionId } = transactionMeta;
    const isEIP1559Transaction =
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const { gasFeeMaxHex } = isEIP1559Transaction
      ? EIP1559GasTransaction
      : legacyGasTransaction;

    const transactionFeeMax = hexToBN(gasFeeMaxHex);
    const transactionValueHex = hexToBN(value);

    const totalTransactionValue = transactionValueHex.add(transactionFeeMax);

    const selectedAddress = transaction?.from as string;
    const weiBalance = hexToBN(accounts[selectedAddress].balance);

    if (!isDecimal(value as string)) {
      return strings('transaction.invalid_amount');
    }

    const insufficientBalanceMessage = validateSufficientBalance(
      weiBalance as unknown as Parameters<typeof validateSufficientBalance>[0],
      totalTransactionValue as unknown as Parameters<
        typeof validateSufficientBalance
      >[1],
      ticker as string,
    );

    if (insufficientBalanceMessage) {
      updateConfirmationMetric({
        id: transactionId as string,
        params: {
          properties: {
            alert_triggered: ['insufficient_funds_for_gas'],
          },
        },
      });
    }

    if (isNativeAsset(selectedAsset) || selectedAsset.tokenId) {
      return insufficientBalanceMessage;
    }

    const insufficientTokenBalanceMessage = validateSufficientTokenBalance(
      transaction as { data: string },
      contractBalances,
      selectedAsset as unknown as Parameters<
        typeof validateSufficientTokenBalance
      >[2],
    );

    return insufficientBalanceMessage || insufficientTokenBalanceMessage;
  };

  setError = (errorMessage?: string) => {
    this.setState({ errorMessage }, () => {
      if (errorMessage) {
        this.scrollView?.scrollToEnd({ animated: true });
      }
    });
  };

  onLedgerConfirmation = async (
    approve: boolean,
    result: unknown,
    transactionMeta: Partial<TransactionMeta>,
    assetType?: string,
    gaParams?: Record<string, unknown>,
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
              .addProperties((gaParams ?? {}) as JsonMap)
              .build(),
          );
          stopGasPolling();
          resetTransactionAction();
        });
      }
    } finally {
      // Error handling derived to LedgerConfirmationModal component
      navigation && getLegacyNavigationParent(navigation)?.popToTop();
    }
  };

  onNext = async () => {
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
            getLegacyNavigationParent(navigation)?.pop();
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
            transactionId: transactionMeta.id as string,
            deviceId,
            onConfirmationComplete: async (approve: boolean) =>
              await this.onLedgerConfirmation(
                approve,
                result,
                transactionMeta,
                assetType,
                {
                  ...this.getAnalyticsParams(),
                  ...getBlockaidTransactionMetricsParams(
                    transaction as unknown as Parameters<
                      typeof getBlockaidTransactionMetricsParams
                    >[0],
                  ),
                  ...this.getTransactionMetrics(),
                },
              ),
            type: 'signTransaction',
          } as unknown as Parameters<typeof createLedgerTransactionModalNavDetails>[0]),
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
              ...getBlockaidTransactionMetricsParams(
                transaction as unknown as Parameters<
                  typeof getBlockaidTransactionMetricsParams
                >[0],
              ),
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
      const errorMessage = (error as Error | undefined)?.message;
      if (
        !errorMessage?.startsWith(KEYSTONE_TX_CANCELED) &&
        !errorMessage?.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(strings('transactions.transaction_error'), errorMessage, [
          { text: 'OK' },
        ]);
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
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
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

  updateTransactionState = (gas: LegacyGasData) => {
    this.setState({
      EIP1559GasTransaction: gas,
      legacyGasTransaction: gas,
    });
  };

  onGasChanged = (gasValue: string | null) => {
    this.setState({ gasSelected: gasValue });
  };

  onGasCanceled = (gasValue: string | null) => {
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
    gasTxn: LegacyGasData;
    gasObj: Record<string, string | undefined>;
    gasSelect: string | null;
    txnType?: boolean;
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
    } as Pick<ConfirmState, keyof ConfirmState>);
  };

  onContactUsClicked = () => {
    const { transaction } = this.props;
    const analyticsParams = {
      ...this.getAnalyticsParams(),
      ...getBlockaidTransactionMetricsParams(
        transaction as unknown as Parameters<
          typeof getBlockaidTransactionMetricsParams
        >[0],
      ),
      external_link_clicked: 'security_alert_support_link',
    };
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  getConfirmButtonStyles() {
    const { securityAlertResponse } = this.props;
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
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

  async persistTransactionParameters(transactionParams: TransactionParams) {
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
        chainId: controllerTransactionMeta?.chainId,
      },
    };
    await (
      updateTransaction as unknown as (tx: TransactionMeta) => Promise<void>
    )(updatedTx as unknown as TransactionMeta);
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
    const colors = (this.context as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const showFeeMarket =
      !gasEstimateType ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
      gasEstimateType === GAS_ESTIMATE_TYPES.NONE;
    const isQRHardwareWalletDevice = isQRHardwareAccount(
      fromSelectedAddress as string,
    );
    const isLedgerAccount = isHardwareAccount(fromSelectedAddress as string, [
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
          {this.state.transactionMeta?.id && (
            <>
              <TransactionBlockaidBanner
                transactionId={this.state.transactionMeta.id}
                style={
                  (styles as Record<string, StyleProp<ViewStyle>>)
                    .blockaidBanner
                }
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
                <CollectibleMedia
                  small
                  iconStyle={styles.CollectibleMedia}
                  containerStyle={styles.CollectibleMedia}
                  collectible={selectedAsset}
                />
              </View>
              <View>
                <Text style={styles.collectibleName}>{selectedAsset.name}</Text>
                <Text style={styles.collectibleTokenId}>{`#${renderShortText(
                  selectedAsset.tokenId as string,
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

Confirm.contextType = ThemeContext;

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
  prepareTransaction: (transaction: LegacyTransactionParams) =>
    dispatch(prepareTransactionAction(transaction)),
  resetTransaction: () => dispatch(resetTransactionAction()),
  setTransactionId: (transactionId: string) =>
    dispatch(
      setTransactionIdAction(
        transactionId as unknown as Parameters<
          typeof setTransactionIdAction
        >[0],
      ),
    ),
  setNonce: (nonce: number) => dispatch(setNonceAction(nonce)),
  setProposedNonce: (nonce: number) => dispatch(setProposedNonceAction(nonce)),
  removeFavoriteCollectible: (
    selectedAddress: string,
    chainId: Hex,
    collectible: LegacySelectedAsset,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
  showAlert: (config: Record<string, unknown>) =>
    dispatch(showAlertAction(config as Parameters<typeof showAlertAction>[0])),
  updateConfirmationMetric: ({
    id,
    params,
  }: {
    id: string;
    params: { properties: Record<string, unknown> };
  }) => dispatch(updateConfirmationMetricAction({ id, params })),
  setTransactionValue: (value: string) =>
    dispatch(setTransactionValueAction(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Confirm as unknown as ComponentType<IWithMetricsAwarenessProps>,
  ),
) as unknown as ComponentType<
  Partial<Omit<ConfirmProps, 'metrics' | 'navigation' | 'route'>> & {
    navigation?: Partial<NavigationProp<ParamListBase>>;
    route?: unknown;
  }
>;
