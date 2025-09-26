import React, { PureComponent } from 'react';
import { baseStyles } from '../../../../../../styles/common';
import {
  InteractionManager,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
// @ts-expect-error - No type declarations available for @metamask/ethjs-query
import Eth from '@metamask/ethjs-query';
import { isEmpty } from 'lodash';
import {
  renderFromWei,
  renderFromTokenMinimalUnit,
  weiToFiat,
  balanceToFiat,
  hexToBN,
} from '../../../../../../util/number';
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
import { getBlockaidTransactionMetricsParams } from '../../../../../../util/blockaid';
import ppomUtil from '../../../../../../lib/ppom/ppom-util';
import { getNetworkNonce } from '../../../../../../util/transaction-controller';
import {
  selectEvmChainId,
  selectNetworkClientId,
  selectProviderTypeByChainId,
  selectNativeCurrencyByChainId
} from '../../../../../../selectors/networkController';
import { selectContractExchangeRatesByChainId } from '../../../../../../selectors/tokenRatesController';
import {
  selectGasFeeEstimates,
  selectCurrentTransactionMetadata,
  selectCurrentTransactionSecurityAlertResponse
} from '../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../selectors/gasFeeController';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { selectConfirmationMetrics, updateConfirmationMetric } from '../../../../../../core/redux/slices/confirmationMetrics';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import TransactionBlockaidBanner from '../../components/TransactionBlockaidBanner/TransactionBlockaidBanner';
import SmartTransactionsMigrationBanner from '../../components/SmartTransactionsMigrationBanner/SmartTransactionsMigrationBanner';
import CustomGasModal from './components/CustomGasModal';
import { TransactionConfirmViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/TransactionConfirmView.selectors';

const EDIT = 'edit';
const EDIT_NONCE = 'edit_nonce';
const REVIEW = 'review';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ConfirmProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractExchangeRates: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractBalances: any;
  ticker: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionState: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  conversionRate: number;
  currentCurrency: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepareTransaction: (transaction: any) => void;
  chainId: string;
  networkClientId: string;
  globalNetworkClientId: string;
  showHexData: boolean;
  showCustomNonce: boolean;
  providerType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedAsset: any;
  resetTransaction: () => void;
  primaryCurrency: string;
  setNonce: (nonce: string) => void;
  setProposedNonce: (nonce: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasFeeEstimates: any;
  gasEstimateType: string;
  isPaymentRequest: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => void;
  isNativeTokenBuySupported: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any;
  setTransactionId: (transactionId: string) => void;
  shouldUseSmartTransaction: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  confirmationMetricsById: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionMetadata: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfirmationMetric: ({ id, params }: { id: string; params: any }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse: any;
  maxValueMode: boolean;
  setTransactionValue: (value: string) => void;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EIP1559GasTransaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EIP1559GasObject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasObject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasTransaction: any;
  multiLayerL1FeeTotal: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionMeta: any;
  isChangeInSimulationModalShown: boolean;
  hasHandledFirstGasUpdate: boolean;
  transactionConfirmed: boolean;
  isAnimating: boolean;
  nonce: string;
}

class Confirm extends PureComponent<ConfirmProps, ConfirmState> {
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
    isAnimating: false,
    nonce: '',
  };

  originIsWalletConnect = this.props.transaction.origin?.startsWith(
    WALLET_CONNECT_ORIGIN,
  );

  originIsMMSDKRemoteConn = this.props.transaction.origin?.startsWith(
    AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
  );

  setNetworkNonce = async (): Promise<void> => {
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(
      transaction,
      networkClientId,
    );
    setNonce(proposedNonce.toString());
    setProposedNonce(proposedNonce.toString());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAnalyticsParams = (transactionMeta: any): any => {
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
      smart_transaction_used: shouldUseSmartTransaction || false,
    };

    const smartTransactionMetricsProperties = shouldUseSmartTransaction
      ? getBlockaidTransactionMetricsParams(transactionMeta)
      : {};

    return {
      ...baseParams,
      ...smartTransactionMetricsProperties,
    };
  };

  componentDidMount = async (): Promise<void> => {
    const {
      contractBalances,
      transactionState: { selectedAsset },
    } = this.props;
    if (!contractBalances || isEmpty(contractBalances)) {
      InteractionManager.runAfterInteractions(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Engine as any).refreshTransactionHistory();
      });
    }
    await this.setNetworkNonce();
    await this.handleFetchBasicEstimates();
    this.parseTransactionDataHeader();
    this.parseTransactionDataFooter();
    if (selectedAsset.tokenId) {
      this.setState({ ready: true });
      return;
    }
    this.handleFetchEstimates();
  };

  componentDidUpdate = async (
    prevProps: ConfirmProps,
    prevState: ConfirmState,
  ): Promise<void> => {
    this.handleTransactionUpdate(prevProps, prevState);
  };

  componentWillUnmount = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Engine.context.TransactionController as any).hub?.removeAllListeners(
      'unapprovedTransaction',
    );
    stopGasPolling();
  };

  handleTransactionUpdate = async (
    prevProps: ConfirmProps,
    prevState: ConfirmState,
  ): Promise<void> => {
    const eth = new Eth(Engine.context.NetworkController.getProviderAndBlockTracker().provider);
    await eth.getTransactionCount(this.state.fromSelectedAddress, 'pending');

    const {
      chainId,
    } = this.props;

    if (prevProps.chainId !== chainId) {
      await this.setNetworkNonce();
      this.handleFetchBasicEstimates();
      this.parseTransactionDataHeader();
      this.parseTransactionDataFooter();
      this.handleFetchEstimates();
    }

    let intervalIdForEstimatedL1Fee: NodeJS.Timeout | undefined;
    if (isMultiLayerFeeNetwork(chainId)) {
      intervalIdForEstimatedL1Fee = setInterval(async () => {
        await this.getEstimatedL1Fee();
      }, 10000);
    }

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validationResult: any = await ppomUtil.validateRequest({
      ...this.props.transactionState.transaction,
      origin: this.props.transaction.origin,
    });

    const { result: transactionResult, transactionMeta } = validationResult || { result: {}, transactionMeta: {} };

    this.setState({
      result: transactionResult,
      transactionMeta,
    });


    const {
      accounts,
      contractBalances,
      selectedAsset: currentSelectedAsset,
      maxValueMode,
      gasFeeEstimates,
    } = this.props;

    const fromAddressChanged = prevProps.accounts !== accounts;
    const previousContractBalance = prevProps.contractBalances;
    const contractBalanceChanged =
      previousContractBalance !== contractBalances;
    const haveEIP1559TotalMaxHexChanged =
      prevState.EIP1559GasTransaction.totalMaxHex !==
      this.state.EIP1559GasTransaction.totalMaxHex;
    const haveGasFeeMaxNativeChanged =
      prevState.EIP1559GasObject.gasFeeMaxNative !==
        this.state.EIP1559GasObject.gasFeeMaxNative ||
      prevState.legacyGasObject.gasFeeMaxNative !==
        this.state.legacyGasObject.gasFeeMaxNative;

    const haveGasPropertiesChanged =
      prevState.EIP1559GasTransaction.gas !==
        this.state.EIP1559GasTransaction.gas ||
      prevState.EIP1559GasTransaction.maxFeePerGas !==
        this.state.EIP1559GasTransaction.maxFeePerGas ||
      prevState.EIP1559GasTransaction.maxPriorityFeePerGas !==
        this.state.EIP1559GasTransaction.maxPriorityFeePerGas ||
      prevState.legacyGasTransaction.gas !== this.state.legacyGasTransaction.gas ||
      prevState.legacyGasTransaction.gasPrice !==
        this.state.legacyGasTransaction.gasPrice;

    if (
      fromAddressChanged ||
      contractBalanceChanged ||
      haveEIP1559TotalMaxHexChanged ||
      haveGasFeeMaxNativeChanged ||
      haveGasPropertiesChanged ||
      prevProps.selectedAsset !== currentSelectedAsset ||
      prevProps.maxValueMode !== maxValueMode ||
      !shallowEqual(prevProps.gasFeeEstimates, gasFeeEstimates)
    ) {
      this.parseTransactionDataHeader();
      this.parseTransactionDataFooter();
    }

    const gasEstimateTypeChanged =
      prevProps.gasEstimateType !== this.props.gasEstimateType;
    const gasSelected =
      prevState.gasSelected !== this.state.gasSelected || gasEstimateTypeChanged;

    if (gasSelected) {
      this.handleFetchEstimates();
    }

    if (prevState.stopUpdateGas !== this.state.stopUpdateGas) {
      if (this.state.stopUpdateGas) {
        stopGasPolling();
      } else {
        startGasPolling();
      }
    }

    if (prevState.errorMessage !== this.state.errorMessage) {
      const error = this.state.errorMessage;
      if (error) {
        this.scrollViewRef?.scrollToEnd({ animated: true });
      }
    }

    if (prevState.transactionMeta !== this.state.transactionMeta) {
      const error = this.state.transactionMeta?.error;
      if (error) {
        this.setState({ errorMessage: error });
      }
    }

    if (intervalIdForEstimatedL1Fee) {
      clearInterval(intervalIdForEstimatedL1Fee);
    }
  };

  parseTransactionDataHeader = (): void => {
    const {
      prepareTransaction: prepareTransactionProp,
      transactionState: { transaction },
    } = this.props;
    prepareTransactionProp(transaction);
  };

  parseTransactionDataFooter = (): void => {
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

    let transactionValueFiat = '';
    if (selectedAsset.isETH) {
      transactionValueFiat = weiToFiat(
        hexToBN(value),
        conversionRate,
        currentCurrency,
      );
    } else {
      const {
        address,
        decimals,
      } = selectedAsset;

      if (!contractBalances[address]) return;

      if (data && data !== '0x') {
        const rawAmountString = decodeTransferData('transfer', data)[1];
        const transferValue = renderFromTokenMinimalUnit(
          rawAmountString,
          decimals,
        );
        transactionValueFiat = balanceToFiat(
          transferValue,
          conversionRate,
          contractExchangeRates[address],
          currentCurrency,
        );
      }
    }



    let transactionValue = '';
    if (selectedAsset.isETH || selectedAsset.tokenId) {
      if (selectedAsset.tokenId) {
        transactionValue = selectedAsset.name;
      } else {
        transactionValue = `${renderFromWei(value)} ${getTicker(ticker)}`;
      }
    } else {
      const { symbol = 'ERC20', decimals } = selectedAsset;
      if (data && data !== '0x') {
        const rawAmountString = decodeTransferData('transfer', data)[1];
        const transferValue = renderFromTokenMinimalUnit(
          rawAmountString,
          decimals,
        );
        transactionValue = `${transferValue} ${symbol}`;
      }
    }

    this.setState({
      transactionValue,
      transactionValueFiat,
    });
  };

  handleFetchBasicEstimates = async (): Promise<void> => {
    this.setState({ gasEstimationReady: false });
    const basicGasEstimates = await this.handleGetBasicGasEstimates();
    this.setState({
      ...basicGasEstimates,
      gasEstimationReady: true,
    });
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleGetBasicGasEstimates = async (): Promise<any> => {
    const { gasEstimateType } = this.props;
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      return await this.handleGetEIP1559GasEstimates();
    }
    return await this.handleGetLegacyGasEstimates();
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleGetEIP1559GasEstimates = async (): Promise<any> => {
    const { gasFeeEstimates, gasEstimateType } = this.props;
    const { gasSelected } = this.state;

    if (gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET) {
      return {};
    }

    const gasLimit = await this.getGasLimit();
    const EIP1559GasData = {
      gasLimit,
      maxFeePerGas: gasFeeEstimates[gasSelected]?.suggestedMaxFeePerGas,
      maxPriorityFeePerGas: gasFeeEstimates[gasSelected]?.suggestedMaxPriorityFeePerGas,
    };

    const EIP1559GasTransaction = {
      gas: gasLimit,
      maxFeePerGas: EIP1559GasData.maxFeePerGas,
      maxPriorityFeePerGas: EIP1559GasData.maxPriorityFeePerGas,
    };

    const EIP1559GasObject = {
      gasFeeMaxNative: renderFromWei(
        hexToBN(EIP1559GasData.maxFeePerGas).mul(hexToBN(gasLimit)),
      ),
    };

    return {
      EIP1559GasData,
      EIP1559GasTransaction,
      EIP1559GasObject,
    };
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleGetLegacyGasEstimates = async (): Promise<any> => {
    const { gasFeeEstimates, gasEstimateType } = this.props;
    const { gasSelected } = this.state;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      return {};
    }

    const gasLimit = await this.getGasLimit();
    const legacyGasData = {
      gasLimit,
      gasPrice: gasFeeEstimates[gasSelected] || gasFeeEstimates.gasPrice,
    };

    const legacyGasTransaction = {
      gas: gasLimit,
      gasPrice: legacyGasData.gasPrice,
    };

    const legacyGasObject = {
      gasFeeMaxNative: renderFromWei(
        hexToBN(legacyGasData.gasPrice).mul(hexToBN(gasLimit)),
      ),
    };

    return {
      legacyGasData,
      legacyGasTransaction,
      legacyGasObject,
    };
  };

  getGasLimit = async (): Promise<string> => {
    const { transaction } = this.props;
    const { fromSelectedAddress } = this.state;

    try {
      const gasLimit = await getGasLimit({
        ...transaction,
        from: fromSelectedAddress,
      });
      return gasLimit.toString();
    } catch (error) {
      Logger.error(error as Error, 'Error getting gas limit');
      return '0x5208';
    }
  };

  handleFetchEstimates = (): void => {
    if (!this.state.stopUpdateGas) {
      startGasPolling();
    }
  };

  onNext = async (): Promise<void> => {
    const { TransactionController } = Engine.context;
    const {
      transactionState: { transaction },
      navigation,
    } = this.props;
    const { fromSelectedAddress } = this.state;

    try {
      const fullTx = {
        ...transaction,
        from: fromSelectedAddress,
        gas: this.state.EIP1559GasTransaction.gas || this.state.legacyGasTransaction.gas,
        gasPrice: this.state.legacyGasTransaction.gasPrice,
        maxFeePerGas: this.state.EIP1559GasTransaction.maxFeePerGas,
        maxPriorityFeePerGas: this.state.EIP1559GasTransaction.maxPriorityFeePerGas,
      };

      const result = await TransactionController.addTransaction(
        fullTx,
        this.props.transaction.origin,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (TransactionController as any).approveTransaction(result);

      this.setState({ transactionConfirmed: true });

      InteractionManager.runAfterInteractions(() => {
        NotificationManager.watchSubmittedTransaction({
          ...fullTx,
          id: result,
        });
      });

      navigation.pop();
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      if (errorMessage.startsWith(KEYSTONE_TX_CANCELED)) {
        this.props.showAlert({
          isVisible: true,
          autodismiss: 1500,
          content: 'clipboard-alert',
          data: { msg: strings('transaction.cancelled') },
        });
        this.setState({ transactionConfirmed: false });
        return;
      }

      this.setState({
        transactionConfirmed: false,
        errorMessage,
      });
    }
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getConfirmButtonStyles = (): any =>
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
     this.state.transactionConfirmed ? {} : {}
  ;

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onGasChanged = (gasData: any): void => {
    const { gasEstimateType } = this.props;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      this.setState({
        EIP1559GasTransaction: gasData,
        EIP1559GasObject: {
          gasFeeMaxNative: renderFromWei(
            hexToBN(gasData.maxFeePerGas).mul(hexToBN(gasData.gas)),
          ),
        },
        advancedGasInserted: true,
      });
    } else {
      this.setState({
        legacyGasTransaction: gasData,
        legacyGasObject: {
          gasFeeMaxNative: renderFromWei(
            hexToBN(gasData.gasPrice).mul(hexToBN(gasData.gas)),
          ),
        },
        advancedGasInserted: true,
      });
    }

    this.parseTransactionDataFooter();
  };

  onGasCanceled = (): void => {
    this.setState({ mode: REVIEW });
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateGasState = (gasData: any): void => {
    this.setState(gasData);
  };

  validateAmount = (): boolean => {
    const { accounts, contractBalances, selectedAsset } = this.props;
    const { fromSelectedAddress } = this.state;

    if (!accounts[fromSelectedAddress]) {
      return false;
    }

    if (selectedAsset.isETH) {
      const balance = accounts[fromSelectedAddress].balance;
      const value = this.props.transactionState.transaction.value;
      const gasTotal = this.state.EIP1559GasTransaction.totalMaxHex ||
                      hexToBN(this.state.legacyGasTransaction.gasPrice || '0x0')
                        .mul(hexToBN(this.state.legacyGasTransaction.gas || '0x0'));

      return hexToBN(balance).gte(hexToBN(value).add(gasTotal));
    }

    const tokenBalance = contractBalances[selectedAsset.address];
    if (!tokenBalance) return false;

    const { data } = this.props.transactionState.transaction;
    if (data && data !== '0x') {
      const rawAmountString = decodeTransferData('transfer', data)[1];
      return hexToBN(tokenBalance).gte(hexToBN(rawAmountString));
    }

    return true;
  };

  toggleConfirmationModal = (mode: string): void => {
    this.setState({ mode });
  };

  toggleHexDataModal = (): void => {
    this.setState({ hexDataModalVisible: !this.state.hexDataModalVisible });
  };

  renderHexDataModal = (): React.ReactNode => {
    const { transactionState } = this.props;
    const { hexDataModalVisible } = this.state;
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = (this.context as any)?.colors || mockTheme.colors;
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
        <View style={styles.hexDataWrapper}>
          <View style={styles.hexDataWrapper}>
            <Text style={styles.hexDataText}>
              {strings('transaction.hex_data')}
            </Text>
            <TouchableOpacity
              onPress={this.toggleHexDataModal}
              style={styles.hexDataClose}
            >
              <IonicIcon name="ios-close" size={28} color={colors.text.default} />
            </TouchableOpacity>
          </View>
          <View style={styles.hexDataWrapper}>
            <Text style={styles.hexDataText}>
              {transactionState.transaction.data || '0x'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  renderCustomNonceModal = (): React.ReactNode => (
      <CustomNonceModal
        proposedNonce={this.props.transaction.nonce}
        nonceValue={this.props.transaction.nonce}
        close={() => this.setState({ mode: REVIEW })}
        save={(nonce: string) => {
          this.props.setNonce(nonce);
          this.props.setProposedNonce(nonce);
          this.setState({ mode: REVIEW });
        }}
      />
    );

  onUpdatingValuesStart = (): void => {
    this.setState({ isAnimating: true });
  };

  onUpdatingValuesEnd = (): void => {
    this.setState({ isAnimating: false });
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransactionState = (transaction: any): void => {
    this.props.prepareTransaction(transaction);
  };

  getEstimatedL1Fee = async (): Promise<void> => {
    const { chainId } = this.props;
    if (!isMultiLayerFeeNetwork(chainId)) return;

    try {
      const transaction = {
        ...this.props.transactionState.transaction,
        from: this.state.fromSelectedAddress,
        gas: this.state.EIP1559GasTransaction.gas || this.state.legacyGasTransaction.gas,
        gasPrice: this.state.legacyGasTransaction.gasPrice,
        maxFeePerGas: this.state.EIP1559GasTransaction.maxFeePerGas,
        maxPriorityFeePerGas: this.state.EIP1559GasTransaction.maxPriorityFeePerGas,
      };

      const l1Fee = await fetchEstimatedMultiLayerL1Fee(
        chainId as `0x${string}`,
        transaction,
      );
      this.setState({ multiLayerL1FeeTotal: l1Fee || '0x0' });
    } catch (error) {
      Logger.error(error as Error, 'Error getting L1 fee estimate');
    }
  };

  buyEth = (): void => {
    const { navigation } = this.props;
    navigation.navigate('PurchaseMethods');
  };

  goToFaucet = (): void => {
    const { chainId } = this.props;
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faucet = (TESTNET_FAUCETS as any)[chainId];
    if (faucet) {
      this.props.navigation.navigate('Webview', {
        screen: 'SimpleWebview',
        params: { url: faucet },
      });
    }
  };

  openAccountSelector = (): void => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.ACCOUNT_SELECTOR,
    });
  };

  onContactUsClicked = (): void => {
    const { navigation } = this.props;
    navigation.navigate('ContactForm');
  };

  setScrollViewRef = (ref: ScrollView): void => {
    this.scrollViewRef = ref;
  };

  scrollViewRef: ScrollView | null = null;

  render(): React.ReactNode {
    const {
      gasEstimateType,
      showCustomNonce,
      primaryCurrency,
      selectedAsset,
      chainId,
      shouldUseSmartTransaction,
      isPaymentRequest: paymentRequest,
      isNativeTokenBuySupported,
    } = this.props;

    const {
      gasEstimationReady,
      fromSelectedAddress,
      transactionValue,
      transactionValueFiat,
      errorMessage,
      mode,
      warningGasPriceHigh,
      EIP1559GasObject,
      legacyGasObject,
      multiLayerL1FeeTotal,
      transactionMeta,
      transactionConfirmed,
      isAnimating,
      gasSelected,
      nonce,
    } = this.state;

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = (this.context as any)?.colors || mockTheme.colors;
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

    const animateOnChange = true;

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={ConfirmViewSelectorsIDs.CONTAINER}
      >
        <AccountFromToInfoCard
          transactionState={this.props.transactionState}
          onPressFromAddressIcon={
            !paymentRequest ? undefined : this.openAccountSelector
          }
          layout="vertical"
          asset={selectedAsset}
          origin={this.props.transaction.origin || ''}
          url={this.props.transaction.origin || ''}
        />
        <ScrollView style={baseStyles.flexGrow} ref={this.setScrollViewRef}>
          {this.state.transactionMeta?.id && (
            <>
              <TransactionBlockaidBanner
                transactionId={this.state.transactionMeta.id}
                style={styles.wrapper}
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
                  style={styles.CollectibleMedia}
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
            originWarning={false}
          />
          {mode === EDIT && (
            <CustomGasModal
              gasSelected={gasSelected}
              animateOnChange={animateOnChange}
              isAnimating={isAnimating}
              legacyGasData={legacyGasObject}
              EIP1559GasData={EIP1559GasObject}
              EIP1559GasTxn={this.state.EIP1559GasTransaction}
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
              nonce={parseInt(nonce, 10)}
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
            {this.props.showHexData && (
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
  }
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepareTransaction: (transaction: any) =>
    dispatch(prepareTransaction(transaction)),
  resetTransaction: () => dispatch(resetTransaction()),
  setTransactionId: (transactionId: string) =>
    dispatch(setTransactionId({ transactionId })),
  setNonce: (nonce: string) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: string) => dispatch(setProposedNonce(nonce)),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeFavoriteCollectible: (selectedAddress: string, chainId: string, collectible: any) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => dispatch(showAlert(config)),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfirmationMetric: ({ id, params }: { id: string; params: any }) =>
    dispatch(updateConfirmationMetric({ id, params })),
  setTransactionValue: (value: string) => dispatch(setTransactionValue(value)),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default connector(withMetricsAwareness(Confirm as any));
