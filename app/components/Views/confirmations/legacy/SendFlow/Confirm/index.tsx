/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
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
// @ts-expect-error -- legacy JavaScript UI type boundary
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

// @ts-expect-error -- legacy JavaScript UI type boundary
let intervalIdForEstimatedL1Fee;

/**
 * View that wraps the wraps the "Send" screen
 */
class Confirm extends PureComponent {

  state = {
    gasEstimationReady: false,
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  originIsWalletConnect = this.props.transaction.origin?.startsWith(
    WALLET_CONNECT_ORIGIN,
  );

  // @ts-expect-error -- legacy JavaScript UI type boundary
  originIsMMSDKRemoteConn = this.props.transaction.origin?.startsWith(
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
  );

  setNetworkNonce = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { globalNetworkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(
      transaction,
      globalNetworkClientId,
    );
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  getAnalyticsParams = (transactionMeta) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      selectedAsset,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimateType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      Logger.error(error, 'Error in getAnalyticsParams:');
      return baseParams;
    }
  };

  updateNavBar = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation, route, resetTransaction, transaction } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      contractBalances,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: { selectedAsset },
    } = this.props;

    const { transactionMeta } = this.state;
    const { TokensController } = Engine.context;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    await stopGasPolling(this.state.pollToken);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    clearInterval(intervalIdForEstimatedL1Fee);

    // @ts-expect-error -- legacy JavaScript UI type boundary
    Engine.rejectPendingApproval(transactionMeta.id, undefined, {
      ignoreMissing: true,
      logErrors: false,
    });

    /**
     * Remove token that was added to the account temporarily
     * Ref.: https://github.com/MetaMask/metamask-mobile/pull/3989#issuecomment-1367558394
     */
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.networkClientId,
      );
    }
  };

  fetchEstimatedL1Fee = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction, chainId } = this.props;
    if (!transaction?.transaction) {
      return;
    }
    try {
      const eth = new Eth(
        Engine.context.NetworkController.getProviderAndBlockTracker().provider,
      );
      const result = await fetchEstimatedMultiLayerL1Fee(eth, {
        txParams: transaction.transaction,
        chainId,
      });
      this.setState({
        multiLayerL1FeeTotal: result,
      });
    } catch (e) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      Logger.error(e, 'fetchEstimatedMultiLayerL1Fee call failed');
      this.setState({
        multiLayerL1FeeTotal: '0x0',
      });
    }
  };

  componentDidMount = async () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      globalNetworkClientId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      showCustomNonce,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      providerType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      isPaymentRequest,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      setTransactionId,
    } = this.props;

    const {
      from,
      transactionTo: to,
      transactionValue: value,
      data,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    } = this.props.transaction;

    this.updateNavBar();
    this.getGasLimit();

    // @ts-expect-error -- legacy JavaScript UI type boundary
    const pollToken = await startGasPolling(this.state.pollToken);
    this.setState({
      pollToken,
    });
    // For analytics
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.SEND_TRANSACTION_STARTED)
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      Logger.error(error, 'error while adding transaction (Confirm)');
      navigation.navigate(Routes.WALLET_VIEW);
      Alert.alert(
        strings('transactions.transaction_error'),
        // @ts-expect-error -- legacy JavaScript UI type boundary
        error && error.message,
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  componentDidUpdate = (prevProps, prevState) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      accounts,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: {
        transactionTo,
        transaction: { value, gas, from },
      },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      contractBalances,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      selectedAsset,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      maxValueMode,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasFeeEstimates,
    } = this.props;

    const { transactionMeta } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { id: transactionId } = transactionMeta;

    this.updateNavBar();

    const transaction = this.prepareTransactionToSend();
    const { EIP1559GasTransaction, legacyGasTransaction } = this.state;

    let error;

    // @ts-expect-error -- legacy JavaScript UI type boundary
    if (this.state?.closeModal) this.toggleConfirmationModal(REVIEW);

    const { errorMessage, fromSelectedAddress } = this.state;
    const valueChanged = prevProps.transactionState.transaction.value !== value;
    const fromAddressChanged =
      prevState.fromSelectedAddress !== fromSelectedAddress;
    const previousContractBalance =
      prevProps.contractBalances[selectedAsset.address];
    const newContractBalance = contractBalances[selectedAsset.address];
    const contractBalanceChanged =
      previousContractBalance !== newContractBalance;
    const recipientIsDefined = transactionTo !== undefined;
    const haveEIP1559TotalMaxHexChanged =
      // @ts-expect-error -- legacy JavaScript UI type boundary
      EIP1559GasTransaction.totalMaxHex !==
      prevState.EIP1559GasTransaction.totalMaxHex;
    const isEIP1559Transaction =
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    const haveGasFeeMaxNativeChanged = isEIP1559Transaction
      // @ts-expect-error -- legacy JavaScript UI type boundary
      ? EIP1559GasTransaction.gasFeeMaxHex !==
        prevState.EIP1559GasTransaction.gasFeeMaxHex
      // @ts-expect-error -- legacy JavaScript UI type boundary
      : legacyGasTransaction.gasFeeMaxHex !==
        prevState.legacyGasTransaction.gasFeeMaxHex;

    const haveGasPropertiesChanged =
      // @ts-expect-error -- legacy JavaScript UI type boundary
      (this.props.gasFeeEstimates &&
        gas &&
        (!prevProps.gasFeeEstimates ||
          !shallowEqual(
            prevProps.gasFeeEstimates,
            // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        EIP1559GasTransaction,
        // @ts-expect-error -- legacy JavaScript UI type boundary
        legacyGasTransaction,
        accountBalance: accounts[from].balance,
        // @ts-expect-error -- legacy JavaScript UI type boundary
        setTransactionValue: this.props.setTransactionValue,
      });

      return;
    }

    if (haveGasPropertiesChanged) {
      const gasEstimateTypeChanged =
        // @ts-expect-error -- legacy JavaScript UI type boundary
        prevProps.gasEstimateType !== this.props.gasEstimateType;
      const gasSelected = gasEstimateTypeChanged
        ? AppConstants.GAS_OPTIONS.MEDIUM
        : this.state.gasSelected;

      if (
        (!this.state.stopUpdateGas && !this.state.advancedGasInserted) ||
        gasEstimateTypeChanged
      ) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        } else if (this.props.gasEstimateType !== GAS_ESTIMATE_TYPES.NONE) {
          // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  setScrollViewRef = (ref) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.scrollView = ref;
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  toggleConfirmationModal = (MODE) => {
    this.onModeChange(MODE);
    this.setState({ closeModal: false });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onModeChange = (mode) => {
    this.setState({ mode });
    if (mode === EDIT) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics.trackEvent(
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      prepareTransaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: { transaction },
    } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { networkClientId } = this.props;
    const estimation = await getGasLimit(transaction, true, networkClientId);
    prepareTransaction({ ...transaction, ...estimation });
  };

  parseTransactionDataHeader = async () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      contractBalances,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      contractExchangeRates,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      conversionRate,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      currentCurrency,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: {
        selectedAsset,
        transaction: { value, data },
      },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      ticker,
    } = this.props;

    let transactionValue, transactionValueFiat;
    const valueBN = hexToBN(value);
    const symbol = ticker ?? selectedAsset?.symbol;
    const parsedTicker = getTicker(symbol);

    if (isNativeToken(selectedAsset)) {
      transactionValue = `${renderFromWei(value)} ${parsedTicker}`;
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

      if (!contractBalances[address]) {
        await TokensController.addToken({
          address,
          symbol,
          decimals,
          image,
          name,
          // @ts-expect-error -- legacy JavaScript UI type boundary
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
      transactionValue = `${transferValue} ${symbol}`;
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

  prepareTransactionToSend = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimateType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      showCustomNonce,
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
  checkRemoveCollectible = () => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: { selectedAsset, assetType },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
    } = this.props;
    const { fromSelectedAddress } = this.state;
    if (assetType === 'ERC721' && chainId !== ChainId.mainnet) {
      const { NftController } = Engine.context;
      removeFavoriteCollectible(fromSelectedAddress, chainId, selectedAsset);
      NftController.removeNft(selectedAsset.address, selectedAsset.tokenId);
    }
  };

  /**
   * Validates transaction balances
   * @returns - Whether there is an error with the amount
   */
  // @ts-expect-error -- legacy JavaScript UI type boundary
  validateAmount = ({ transaction }) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      accounts,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      contractBalances,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      selectedAsset,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      ticker,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: {
        transaction: { value },
      },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      updateConfirmationMetric,
    } = this.props;
    const { EIP1559GasTransaction, legacyGasTransaction, transactionMeta } =
      this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { id: transactionId } = transactionMeta;
    const isEIP1559Transaction =
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { gasFeeMaxHex } = isEIP1559Transaction
      ? EIP1559GasTransaction
      : legacyGasTransaction;

    const transactionFeeMax = hexToBN(gasFeeMaxHex);
    const transactionValueHex = hexToBN(value);

    const totalTransactionValue = transactionValueHex.add(transactionFeeMax);

    const selectedAddress = transaction?.from;
    const weiBalance = hexToBN(accounts[selectedAddress].balance);

    if (!isDecimal(value)) {
      return strings('transaction.invalid_amount');
    }

    const insufficientBalanceMessage = validateSufficientBalance(
      weiBalance,
      totalTransactionValue,
      ticker,
    );

    if (insufficientBalanceMessage) {
      updateConfirmationMetric({
        id: transactionId,
        params: {
          properties: {
            alert_triggered: ['insufficient_funds_for_gas'],
          },
        },
      });
    }

    if (isNativeToken(selectedAsset) || selectedAsset.tokenId) {
      return insufficientBalanceMessage;
    }

    const insufficientTokenBalanceMessage = validateSufficientTokenBalance(
      transaction,
      contractBalances,
      selectedAsset,
    );

    return insufficientBalanceMessage || insufficientTokenBalanceMessage;
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  setError = (errorMessage) => {
    this.setState({ errorMessage }, () => {
      if (errorMessage) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.scrollView.scrollToEnd({ animated: true });
      }
    });
  };

  onLedgerConfirmation = async (
    // @ts-expect-error -- legacy JavaScript UI type boundary
    approve,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    result,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    transactionMeta,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    assetType,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    gaParams,
  ) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
          // @ts-expect-error -- legacy JavaScript UI type boundary
          this.props.metrics.trackEvent(
            // @ts-expect-error -- legacy JavaScript UI type boundary
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
      navigation && navigation.dangerouslyGetParent()?.popToTop();
    }
  };

  onNext = async () => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionState: { assetType },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      navigation,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      resetTransaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      shouldUseSmartTransaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionMetadata,
    } = this.props;

    const transactionSimulationData = transactionMetadata?.simulationData;
    const { isUpdatedAfterSecurityCheck } = transactionSimulationData ?? {};

    // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            // @ts-expect-error -- legacy JavaScript UI type boundary
            transactionId: transactionMeta.id,
            deviceId,
            onConfirmationComplete: async (approve) =>
              await this.onLedgerConfirmation(
                approve,
                result,
                transactionMeta,
                assetType,
                {
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  ...this.getAnalyticsParams(),
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  ...getBlockaidTransactionMetricsParams(transaction),
                  ...this.getTransactionMetrics(),
                },
              ),
            // @ts-expect-error -- legacy JavaScript UI type boundary
            type: 'signTransaction',
          }),
        );
        return;
      }

      await KeyringController.resetQRKeyringState();

      if (shouldUseSmartTransaction) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        await ApprovalController.accept(transactionMeta.id, undefined, {
          waitForResult: false,
        });
        navigation.navigate(Routes.TRANSACTIONS_VIEW);
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        await ApprovalController.accept(transactionMeta.id, undefined, {
          waitForResult: true,
        });
      }

      await new Promise((resolve) => resolve(result));

      // @ts-expect-error -- legacy JavaScript UI type boundary
      if (transactionMeta.error) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        throw transactionMeta.error;
      }

      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...transactionMeta,
          assetType,
        });
        this.checkRemoveCollectible();
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics.trackEvent(
          // @ts-expect-error -- legacy JavaScript UI type boundary
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.SEND_TRANSACTION_COMPLETED)
            .addProperties({
              ...this.getAnalyticsParams(transactionMeta),
              // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        // @ts-expect-error -- legacy JavaScript UI type boundary
        !error?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          // @ts-expect-error -- legacy JavaScript UI type boundary
          error && error.message,
          [{ text: 'OK' }],
        );
        // @ts-expect-error -- legacy JavaScript UI type boundary
        Logger.error(error, 'error while trying to send transaction (Confirm)');
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics.trackEvent(
          // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  getBalanceError = (balance) => {
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onSelectAccount = async (accountAddress) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { accounts } = this.props;
    // If new account doesn't have the asset
    this.setState({
      fromSelectedAddress: accountAddress,
      balanceIsZero: hexToBN(accounts[accountAddress].balance).isZero(),
    });
    this.parseTransactionDataHeader();
  };

  openAccountSelector = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateTransactionStateWithUpdatedNonce = (nonceValue) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.setNonce(nonceValue);
  };

  renderCustomNonceModal = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  handleCopyHex = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { data } = this.props.transactionState.transaction;
    ClipboardManager.setString(data);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transaction.hex_data_copied') },
    });
  };

  renderHexDataModal = () => {
    const { hexDataModalVisible } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { data } = this.props.transactionState.transaction;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    try {
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

  goToFaucet = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { chainId } = this.props;
    InteractionManager.runAfterInteractions(() => {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.navigation.navigate(Routes.BROWSER.VIEW, {
        newTabUrl: TESTNET_FAUCETS[chainId],
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateTransactionState = (gas) => {
    this.setState({
      EIP1559GasTransaction: gas,
      legacyGasTransaction: gas,
    });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onGasChanged = (gasValue) => {
    this.setState({ gasSelected: gasValue });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onGasCanceled = (gasValue) => {
    this.setState({
      stopUpdateGas: false,
      gasSelectedTemp: gasValue,
      closeModal: true,
    });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateGasState = ({ gasTxn, gasObj, gasSelect, txnType }) => {
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
    });
  };

  onContactUsClicked = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction } = this.props;
    const analyticsParams = {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      ...this.getAnalyticsParams(),
      ...getBlockaidTransactionMetricsParams(transaction),
      external_link_clicked: 'security_alert_support_link',
    };
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.metrics.trackEvent(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.CONTRACT_ADDRESS_COPIED)
        .addProperties(analyticsParams)
        .build(),
    );
  };

  getConfirmButtonStyles() {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { securityAlertResponse } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  async persistTransactionParameters(transactionParams) {
    const { TransactionController } = Engine.context;
    const { transactionMeta } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { id: transactionId } = transactionMeta;

    const controllerTransactionMeta =
      TransactionController.state.transactions.find(
        (tx) => tx.id === transactionId,
      );

    const updatedTx = {
      ...controllerTransactionMeta,
      txParams: {
        ...transactionParams,
        // @ts-expect-error -- legacy JavaScript UI type boundary
        chainId: controllerTransactionMeta.chainId,
      },
    };
    // @ts-expect-error -- legacy JavaScript UI type boundary
    await updateTransaction(updatedTx);
  }

  getTransactionMetrics = () => {
    const { transactionMeta } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { confirmationMetricsById } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { id: transactionId } = transactionMeta;

    return confirmationMetricsById[transactionId]?.properties || {};
  };

  render = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { selectedAsset, paymentRequest } = this.props.transactionState;
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      showHexData,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      showCustomNonce,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      primaryCurrency,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimateType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      isNativeTokenBuySupported,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      shouldUseSmartTransaction,
    } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { nonce } = this.props.transaction;
    const {
      gasEstimationReady,
      fromSelectedAddress,
      transactionValue = '',
      transactionValueFiat = '',
      errorMessage,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactionConfirmed,
      warningGasPriceHigh,
      mode,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      isAnimating,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      animateOnChange,
      multiLayerL1FeeTotal,
      gasSelected,
      EIP1559GasObject,
      EIP1559GasTransaction,
      legacyGasObject,
      transactionMeta,
    } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
          // @ts-expect-error -- legacy JavaScript UI type boundary
          transactionState={this.props.transactionState}
          // @ts-expect-error -- legacy JavaScript UI type boundary
          onPressFromAddressIcon={
            !paymentRequest ? null : this.openAccountSelector
          }
          layout="vertical"
        />
        <ScrollView style={baseStyles.flexGrow} ref={this.setScrollViewRef}>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          {this.state.transactionMeta?.id && (
            <>
              <TransactionBlockaidBanner
                // @ts-expect-error -- legacy JavaScript UI type boundary
                transactionId={this.state.transactionMeta.id}
                // @ts-expect-error -- legacy JavaScript UI type boundary
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
                <CollectibleMedia
                  small
                  // @ts-expect-error -- legacy JavaScript UI type boundary
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
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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

          {(this.state.gasSelected as any) === AppConstants.GAS_OPTIONS.LOW && (
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => {
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  prepareTransaction: (transaction) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setTransactionId: (transactionId) =>
    dispatch(setTransactionId(transactionId)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setNonce: (nonce) => dispatch(setNonce(nonce)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setProposedNonce: (nonce) => dispatch(setProposedNonce(nonce)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  removeFavoriteCollectible: (selectedAddress, chainId, collectible) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  showAlert: (config) => dispatch(showAlert(config)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateConfirmationMetric: ({ id, params }) =>
    dispatch(updateConfirmationMetric({ id, params })),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setTransactionValue: (value) => dispatch(setTransactionValue(value)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error -- legacy JavaScript UI type boundary
)(withMetricsAwareness(Confirm));

interface ConfirmProps {
  accounts?: Record<string, any>;
  chainId?: string;
  confirmationMetricsById?: Record<string, any>;
  contractBalances?: Record<string, any>;
  contractExchangeRates?: Record<string, any>;
  conversionRate?: number;
  currentCurrency?: string;
  gasEstimateType?: string;
  gasFeeEstimates?: Record<string, any>;
  globalNetworkClientId?: string;
  isNativeTokenBuySupported?: boolean;
  isPaymentRequest?: boolean;
  maxValueMode?: boolean;
  metrics?: Record<string, any>;
  navigation?: Record<string, any>;
  networkClientId?: string;
  prepareTransaction?: (...args: any[]) => any;
  primaryCurrency?: string;
  providerType?: string;
  resetTransaction?: (...args: any[]) => any;
  route?: Record<string, any>;
  securityAlertResponse?: Record<string, any>;
  selectedAsset?: Record<string, any>;
  setNonce?: (...args: any[]) => any;
  setProposedNonce?: (...args: any[]) => any;
  setTransactionId?: (...args: any[]) => any;
  setTransactionValue?: (...args: any[]) => any;
  shouldUseSmartTransaction?: boolean;
  showAlert?: (...args: any[]) => any;
  showCustomNonce?: boolean;
  showHexData?: boolean;
  ticker?: string;
  transaction: Record<string, any>;
  transactionMetadata?: Record<string, any>;
  transactionState?: Record<string, any>;
  updateConfirmationMetric?: (...args: any[]) => any;
}
