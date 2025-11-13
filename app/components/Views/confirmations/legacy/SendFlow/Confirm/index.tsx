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
// @ts-ignore - no type definitions available
import Eth from '@metamask/ethjs-query';
import BN from 'bn.js';
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
import type { Hex } from '@metamask/utils';
import { TokenI } from '../../../../../UI/Tokens/types';
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
  // Pending updated multichain UX to specify the send chain.
  // eslint-disable-next-line no-restricted-syntax
  selectNetworkClientId,
  selectProviderTypeByChainId,
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import { updateTransactionToMaxValue } from './utils';
import SmartTransactionsMigrationBanner from '../../components/SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import { isNativeToken } from '../../../utils/generic';

const EDIT = 'edit';
const EDIT_NONCE = 'edit_nonce';
const REVIEW = 'review';
const POLLING_INTERVAL_ESTIMATED_L1_FEE = 30000;

let intervalIdForEstimatedL1Fee: NodeJS.Timeout | undefined;

function ensureHex(input: string | BN): Hex {
  if (typeof input === 'string') {
    return (input.startsWith('0x') ? input : `0x${input}`) as Hex;
  }
  const hexString = input.toString(16);
  return `0x${hexString}` as Hex;
}

function toTokenI(asset: SelectedAsset): TokenI {
  return {
    address: asset.address ?? '0x',
    aggregators: [],
    decimals: asset.decimals ?? 0,
    image: asset.image ?? '',
    name: asset.name ?? (asset.symbol ?? ''),
    symbol: asset.symbol ?? '',
    balance: asset.balance ?? '0',
    balanceFiat: asset.balanceFiat,
    logo: asset.image,
    isETH: asset.isETH,
    isNative: asset.isETH,
  };
}

type MobileTransactionMeta = TransactionMeta & {
  simulationData?: unknown;
};

interface SelectedAsset {
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  name?: string;
  tokenId?: string;
  isETH?: boolean;
  balanceFiat?: string;
  balance?: string;
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
}

interface TransactionState {
  transaction: TransactionObject;
  transactionTo?: string;
  transactionToName?: string;
  transactionFromName?: string;
  selectedAsset: SelectedAsset;
  assetType?: string;
  paymentRequest?: boolean;
}

interface Transaction {
  from?: string;
  to?: string;
  transactionTo?: string;
  transactionValue?: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  origin?: string;
  transaction?: TransactionObject;
}

interface GasTransaction {
  totalMaxHex?: string;
  gasFeeMaxHex?: string;
  gasFeeMaxNative?: string;
  gasFeeMaxConversion?: string;
  totalMaxNative?: string;
  totalMaxConversion?: string;
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  error?: string;
}

interface GasObject {
  suggestedMaxFeePerGas?: string;
  suggestedMaxPriorityFeePerGas?: string;
  suggestedGasLimit?: string;
  suggestedGasPrice?: string;
}

interface TransactionMeta {
  id: string;
  origin?: string;
  txParams?: TransactionObject;
  status?: string;
  error?: Error;
  hash?: string;
  chainId?: string;
  networkClientId?: string;
}

interface ConfirmProps {
  navigation: any;
  route: any;
  accounts: { [address: string]: { balance: string } };
  contractBalances: { [address: string]: string };
  ticker: string;
  transactionState: TransactionState;
  transaction: Transaction;
  conversionRate?: number;
  currentCurrency: string;
  contractExchangeRates: { [address: string]: number };
  prepareTransaction: (transaction: any) => void;
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
  gasFeeEstimates: any;
  gasEstimateType: string;
  isPaymentRequest: boolean;
  showAlert: (config: any) => void;
  isNativeTokenBuySupported: boolean;
  metrics: any;
  setTransactionId: (id: string) => void;
  shouldUseSmartTransaction: boolean;
  confirmationMetricsById: { [id: string]: any };
  transactionMetadata?: TransactionMeta;
  updateConfirmationMetric: (params: { id: string; params: any }) => void;
  securityAlertResponse?: any;
  maxValueMode: boolean;
  setTransactionValue: (value: string) => void;
  removeFavoriteCollectible?: (address: string, chainId: string, collectible: any) => void;
}

interface ConfirmState {
  gasEstimationReady: boolean;
  fromSelectedAddress: string;
  hexDataModalVisible: boolean;
  warningGasPriceHigh?: string;
  ready: boolean;
  transactionValue?: string;
  transactionValueFiat?: string;
  errorMessage?: string;
  mode: string;
  gasSelected: string;
  stopUpdateGas: boolean;
  advancedGasInserted: boolean;
  EIP1559GasTransaction: GasTransaction;
  EIP1559GasObject: GasObject;
  legacyGasObject: GasObject;
  legacyGasTransaction: GasTransaction;
  multiLayerL1FeeTotal: string;
  result?: any;
  transactionMeta: Partial<TransactionMeta>;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  pollToken?: string;
  transactionConfirmed?: boolean;
  isAnimating?: boolean;
  animateOnChange?: boolean;
  closeModal?: boolean;
}

class Confirm extends PureComponent<ConfirmProps, ConfirmState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;
  scrollView: any;

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

  setNetworkNonce = async () => {
    const { globalNetworkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(
      transaction as any,
      globalNetworkClientId,
    );
    setNonce(String(proposedNonce));
    setProposedNonce(String(proposedNonce));
  };

  getAnalyticsParams = async (transactionMeta: any) => {
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

      const smartTransactionMetricsProperties =
        await getSmartTransactionMetricsProperties(
          SmartTransactionsController as any,
          transactionMeta as any,
          false,
          undefined,
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

  updateNavBar = () => {
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

  componentWillUnmount = async () => {
    const {
      contractBalances,
      transactionState: { selectedAsset },
    } = this.props;

    const { transactionMeta } = this.state;
    const { TokensController } = Engine.context;
    await stopGasPolling();
    clearInterval(intervalIdForEstimatedL1Fee);

    if (transactionMeta.id) {
      Engine.rejectPendingApproval(transactionMeta.id, undefined as any, {
        ignoreMissing: true,
        logErrors: false,
      } as any);
    }

    /**
     * Remove token that was added to the account temporarily
     * Ref.: https://github.com/MetaMask/metamask-mobile/pull/3989#issuecomment-1367558394
     */
    if (
      isNativeToken(toTokenI(selectedAsset)) ||
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
        txParams: transaction.transaction as any,
        chainId,
      });
      const hexResult = result ? ensureHex(result) : ensureHex('0');
      this.setState({
        multiLayerL1FeeTotal: hexResult as any,
      });
    } catch (e) {
      Logger.error(e as Error, 'fetchEstimatedMultiLayerL1Fee call failed');
      this.setState({
        multiLayerL1FeeTotal: ensureHex('0'),
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
        .addProperties(this.getAnalyticsParams({}))
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
        error instanceof Error ? error.message : String(error),
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
      prevProps.contractBalances[selectedAsset.address || ''];
    const newContractBalance = contractBalances[selectedAsset.address || ''];
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
      this.scrollView.scrollToEnd({ animated: true });
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
        EIP1559GasTransaction: EIP1559GasTransaction as any,
        legacyGasTransaction: legacyGasTransaction as any,
        accountBalance: accounts[from || '']?.balance,
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
          this.setError(this.state.legacyGasTransaction.error ?? '');
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

  setScrollViewRef = (ref: any) => {
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
    prepareTransaction({ ...transaction, ...estimation });
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
    const parsedTicker = getTicker(symbol);

    if (isNativeToken(toTokenI(selectedAsset))) {
      transactionValue = `${renderFromWei(value ?? '0x0')} ${parsedTicker}`;
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
        symbol = 'ERC20',
        decimals,
        image,
        name,
      } = selectedAsset;
      const { TokensController } = Engine.context;

      if (address && !contractBalances[address]) {
        await TokensController.addToken({
          address,
          symbol,
          decimals: decimals ?? 0,
          image,
          name,
          networkClientId: this.props.networkClientId,
        });
      }

      const [, , rawAmount] = decodeTransferData('transfer', data ?? '0x');
      const rawAmountString = parseInt(rawAmount, 16).toLocaleString(
        'fullwide',
        { useGrouping: false },
      );
      const transferValue = renderFromTokenMinimalUnit(
        rawAmountString,
        decimals ?? 0,
      );
      transactionValue = `${transferValue} ${symbol}`;
      const exchangeRate = address && contractExchangeRates && contractExchangeRates[address]
        ? (typeof contractExchangeRates[address] === 'number' ? contractExchangeRates[address] : (contractExchangeRates[address] as any)?.price)
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
      gasEstimateType: gasEstimateType as any,
      showCustomNonce,
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
      removeFavoriteCollectible(fromSelectedAddress, chainId, selectedAsset);
      NftController.removeNft(selectedAsset.address ?? '', selectedAsset.tokenId ?? '');
    }
  };

  /**
   * Validates transaction balances
   * @returns - Whether there is an error with the amount
   */
  validateAmount = ({ transaction }: { transaction: any }) => {
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

    const selectedAddress = transaction?.from;
    const weiBalance = hexToBN(accounts[selectedAddress ?? '']?.balance ?? '0x0');

    if (!isDecimal(value ?? '0x0')) {
      return strings('transaction.invalid_amount');
    }

    const insufficientBalanceMessage = validateSufficientBalance(
      weiBalance.toString(10),
      totalTransactionValue.toString(10),
      ticker ?? '',
    );

    if (insufficientBalanceMessage) {
      updateConfirmationMetric({
        id: transactionId ?? '',
        params: {
          properties: {
            alert_triggered: ['insufficient_funds_for_gas'],
          },
        },
      });
    }

    if (isNativeToken(toTokenI(selectedAsset)) || selectedAsset.tokenId) {
      return insufficientBalanceMessage;
    }

    const insufficientTokenBalanceMessage = validateSufficientTokenBalance(
      transaction,
      contractBalances,
      selectedAsset as any,
    );

    return insufficientBalanceMessage || insufficientTokenBalanceMessage;
  };

  setError = (errorMessage: string) => {
    this.setState({ errorMessage }, () => {
      if (errorMessage) {
        this.scrollView.scrollToEnd({ animated: true });
      }
    });
  };

  onLedgerConfirmation = async (
    approve: boolean,
    result: any,
    transactionMeta: TransactionMeta,
    assetType: string,
    gaParams: any,
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
              .addProperties(gaParams)
              .build(),
          );
          stopGasPolling();
          resetTransaction();
        });
      }
    } finally {
      // Error handling derived to LedgerConfirmationModal component
      navigation?.dangerouslyGetParent()?.popToTop();
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

    const transactionSimulationData = (transactionMetadata as MobileTransactionMeta)?.simulationData;
    const { isUpdatedAfterSecurityCheck } = (transactionSimulationData as any) ?? {};

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
            navigation?.dangerouslyGetParent()?.pop();
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
        const analyticsParams = await this.getAnalyticsParams();
        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: transactionMeta.id ?? '',
            deviceId,
            onConfirmationComplete: async (approve: boolean) =>
              await this.onLedgerConfirmation(
                approve,
                result,
                transactionMeta as any,
                assetType,
                {
                  ...analyticsParams,
                  ...getBlockaidTransactionMetricsParams(transaction as any),
                  ...this.getTransactionMetrics(),
                },
              ),
          } as any),
        );
        return;
      }

      await KeyringController.resetQRKeyringState();

      if (shouldUseSmartTransaction) {
        await ApprovalController.accept(transactionMeta.id ?? '', undefined, {
          waitForResult: false,
        });
        navigation.navigate(Routes.TRANSACTIONS_VIEW);
      } else {
        await ApprovalController.accept(transactionMeta.id ?? '', undefined, {
          waitForResult: true,
        });
      }

      await new Promise((resolve) => resolve(result));

      if (transactionMeta.error) {
        throw transactionMeta.error;
      }

      const analyticsParamsForCompletion = await this.getAnalyticsParams(transactionMeta);
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
              ...analyticsParamsForCompletion,
              ...getBlockaidTransactionMetricsParams(transaction as any),
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.startsWith(KEYSTONE_TX_CANCELED) &&
        !errorMessage.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          errorMessage,
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
    } as any);
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

  updateTransactionStateWithUpdatedNonce = (nonceValue: string) => {
    this.props.setNonce(nonceValue);
  };

  renderCustomNonceModal = () => {
    const { nonce } = this.props.transaction;
    const proposedNonce = (this.props.transaction as any).proposedNonce;
    return (
      <CustomNonceModal
        proposedNonce={proposedNonce ? Number(proposedNonce) : 0}
        nonceValue={nonce ? Number(nonce) : 0}
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

  buyEth = () => {
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

  goToFaucet = () => {
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: (TESTNET_FAUCETS as any)[chainId],
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

  updateTransactionState = (gas: any) => {
    this.setState({
      EIP1559GasTransaction: gas,
      legacyGasTransaction: gas,
    });
  };

  onGasChanged = (gasValue: any) => {
    this.setState({ gasSelected: gasValue });
  };

  onGasCanceled = (gasValue: any) => {
    this.setState({
      stopUpdateGas: false,
      gasSelectedTemp: gasValue,
      closeModal: true,
    } as any);
  };

  updateGasState = ({ gasTxn, gasObj, gasSelect, txnType }: any) => {
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
    } as any);
  };

  onContactUsClicked = () => {
    const { transaction } = this.props;
    this.getAnalyticsParams().then((baseParams) => {
      const analyticsParams = {
        ...baseParams,
        ...getBlockaidTransactionMetricsParams(transaction as any),
        external_link_clicked: 'security_alert_support_link',
      };
      this.props.metrics.trackEvent(
        this.props.metrics
          .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
          .addProperties(analyticsParams)
          .build(),
      );
    });
  };

  getConfirmButtonStyles() {
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

  async persistTransactionParameters(transactionParams: any) {
    const { TransactionController } = Engine.context;
    const { transactionMeta } = this.state;
    const { id: transactionId } = transactionMeta;

    const controllerTransactionMeta =
      TransactionController.state.transactions.find(
        (tx: any) => tx.id === transactionId,
      );

    if (!controllerTransactionMeta) {
      return;
    }

    const updatedTx = {
      ...controllerTransactionMeta,
      txParams: {
        ...transactionParams,
        chainId: controllerTransactionMeta.chainId,
      },
    };
    await updateTransaction(updatedTx as any, {} as any);
  }

  getTransactionMetrics = () => {
    const { transactionMeta } = this.state;
    const { confirmationMetricsById } = this.props;
    const { id: transactionId } = transactionMeta;

    return confirmationMetricsById?.[transactionId ?? '']?.properties || {};
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
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
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
        <AccountFromToInfoCard
          url=""
          origin=""
          asset={selectedAsset}
          transactionState={this.props.transactionState as any}
          onPressFromAddressIcon={
            !paymentRequest ? undefined : this.openAccountSelector
          }
          layout="vertical"
        />
        <ScrollView style={baseStyles.flexGrow} ref={this.setScrollViewRef}>
          {this.state.transactionMeta?.id && (
            <>
              <TransactionBlockaidBanner
                transactionId={this.state.transactionMeta.id}
                style={(styles as any).blockaidBanner}
                onContactUsClicked={this.onContactUsClicked}
              />
              <SmartTransactionsMigrationBanner
                style={(styles as any).smartTransactionsMigrationBanner}
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
                  collectible={selectedAsset as any}
                  small={true}
                  iconStyle={styles.CollectibleMedia as any}
                  containerStyle={styles.CollectibleMedia as any}
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
            hideTotal={false}
            noMargin={false}
            originWarning={undefined}
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
              nonce={nonce ? Number(nonce) : undefined}
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

const mapStateToProps = (state: any) => {
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

const mapDispatchToProps = (dispatch: any) => ({
  prepareTransaction: (transaction: any) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionId: (transactionId: any) =>
    dispatch(setTransactionId(transactionId)),
  setNonce: (nonce: any) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: any) => dispatch(setProposedNonce(nonce)),
  removeFavoriteCollectible: (selectedAddress: any, chainId: any, collectible: any) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  showAlert: (config: any) => dispatch(showAlert(config)),
  updateConfirmationMetric: ({ id, params }: any) =>
    dispatch(updateConfirmationMetric({ id, params })),
  setTransactionValue: (value: any) => dispatch(setTransactionValue(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Confirm as any));
