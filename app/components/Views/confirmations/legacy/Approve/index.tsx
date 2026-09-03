import React, { PureComponent, type ComponentType } from 'react';
import {
  Alert,
  AppState,
  View,
  type AppStateStatus,
  type NativeEventSubscription,
} from 'react-native';
import type { TransactionMeta, SimulationData } from '@metamask/transaction-controller';
import { getApproveNavbar } from '../../../../UI/Navbar';
import { connect } from 'react-redux';
import {
  safeToChecksumAddress,
  isHardwareAccount,
} from '../../../../../util/address';
import Engine from '../../../../../core/Engine';
import AnimatedTransactionModal from '../../../../UI/AnimatedTransactionModal';
import ApproveTransactionReview from '../components/ApproveTransactionReview';
import AddNickname from '../components/ApproveTransactionReview/AddNickname';
import Modal from 'react-native-modal';
import { strings } from '../../../../../../locales/i18n';

import {
  setTransactionObject as setTransactionObjectAction,
  setNonce as setNonceAction,
  setProposedNonce as setProposedNonceAction,
} from '../../../../../actions/transaction';
import {
  GAS_ESTIMATE_TYPES,
  type GasEstimateType,
} from '@metamask/gas-fee-controller';
import { fromWei, renderFromWei, hexToBN } from '../../../../../util/number';
import {
  getNormalizedTxState,
  getTicker,
} from '../../../../../util/transactions';
import { getGasLimit } from '../../../../../util/custom-gas';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import NotificationManager from '../../../../../core/NotificationManager';
import { MetaMetricsEvents } from '../../../../../core/Analytics';
import Logger from '../../../../../util/Logger';
import EditGasFee1559 from '../components/EditGasFee1559Update';
import EditGasFeeLegacy from '../components/EditGasFeeLegacyUpdate';
import AppConstants from '../../../../../core/AppConstants';
import { shallowEqual } from '../../../../../util/general';
import { KEYSTONE_TX_CANCELED } from '../../../../../constants/error';
import GlobalAlert from '../../../../UI/GlobalAlert';
import checkIfAddressIsSaved from '../../../../../util/checkAddress';
import { ThemeContext, mockTheme } from '../../../../../util/theme';
import { createLedgerTransactionModalNavDetails } from '../../../../UI/LedgerModals/LedgerTransactionModal';
import {
  startGasPolling,
  stopGasPolling,
} from '../../../../../core/GasPolling/GasPolling';
import {
  selectNativeCurrencyByChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectProviderTypeByChainId,
  selectRpcUrlByChainId,
} from '../../../../../selectors/networkController';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../selectors/currencyRateController';
import { selectTokensLength } from '../../../../../selectors/tokensController';
import {
  selectAccounts,
  selectAccountsLength,
} from '../../../../../selectors/accountTrackerController';
import ShowBlockExplorer from '../components/ApproveTransactionReview/ShowBlockExplorer';
import createStyles from './styles';
import { providerErrors } from '@metamask/rpc-errors';
import { getDeviceId } from '../../../../../core/Ledger/Ledger';
import ExtendedKeyringTypes from '../../../../../constants/keyringTypes';
import {
  getNetworkNonce,
  updateTransaction,
} from '../../../../../util/transaction-controller';
import { withMetricsAwareness } from '../../../../../components/hooks/useMetrics';
import {
  selectGasFeeEstimates,
  selectCurrentTransactionMetadata,
} from '../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../selectors/gasFeeController';
import { selectShouldUseSmartTransaction } from '../../../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../../../util/smart-transactions/smart-publish-hook';
import { selectTransactions } from '../../../../../selectors/transactionController';
import {
  selectPrimaryCurrency,
  selectShowCustomNonce,
} from '../../../../../selectors/settings';
import { selectAddressBook } from '../../../../../selectors/addressBookController';
import { buildTransactionParams } from '../../../../../util/confirmation/transactions';
import Routes from '../../../../../constants/navigation/Routes';
import { isNonEvmChainId } from '../../../../../core/Multichain/utils';
import type { RootState } from '../../../../../reducers';
import type { Dispatch } from 'redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Theme } from '../../../../../util/theme/models';
import type { IWithMetricsAwarenessProps } from '../../../../../components/hooks/useMetrics/withMetricsAwareness.types';
import type { JsonMap } from '../../../../../core/Analytics/MetaMetrics.types';
import type { Hex } from '@metamask/utils';
import type BN from 'bnjs4';

const EDIT = 'edit';
const REVIEW = 'review';

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
interface LegacyTransaction {
  id?: string;
  chainId?: string;
  networkId?: string;
  from?: string;
  to?: string;
  value?: string | number;
  gas?: string | number | BN;
  gasPrice?: string | number;
  nonce?: string | number;
  data?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: string;
  assetType?: string;
  selectedAsset?: {
    address?: string;
    tokenId?: string | number;
    symbol?: string;
    contractName?: string;
  };
  txParams?: {
    from?: string;
    to?: string;
    value?: string | number;
    gas?: string | number;
    gasPrice?: string | number;
    data?: string;
  };
}

interface LegacyTransactionMeta {
  id?: string;
  txParams?: LegacyTransaction;
  [key: string]: unknown;
}

interface GasData {
  [key: string]: string | number | boolean | null | undefined;
  suggestedGasLimit?: string | number;
  suggestedGasPrice?: string | number;
  suggestedGasLimitHex?: string;
  suggestedGasPriceHex?: string;
  totalHex?: string;
  totalMaxHex?: string;
  error?: string;
}

interface State {
  approved: boolean;
  gasError?: string;
  ready: boolean;
  mode: string;
  over: boolean;
  analyticsParams: Record<string, unknown>;
  gasSelected: string | null;
  gasSelectedTemp: string | null;
  transactionConfirmed: boolean;
  shouldAddNickname: boolean;
  shouldVerifyContractDetails: boolean;
  suggestedGasLimit?: string | number;
  eip1559GasObject: GasData;
  eip1559GasTransaction: GasData;
  legacyGasObject: GasData;
  legacyGasTransaction: GasData;
  isBlockExplorerVisible: boolean;
  address: string;
  tokenAllowanceState?: Record<string, unknown>;
  isGasEstimateStatusIn: boolean;
  isChangeInSimulationModalOpen: boolean;
  animateOnChange?: boolean;
  pollToken?: string;
  stopUpdateGas?: boolean;
  advancedGasInserted?: boolean;
  isAnimating?: boolean;
  transactionHandled?: boolean;
}

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
  hideModal: () => void;
}

interface StateProps {
  accounts: Record<string, { balance: string }>;
  transaction: LegacyTransaction;
  transactions?: LegacyTransactionMeta[];
  providerType?: string;
  modalVisible?: boolean;
  ticker?: string;
  gasFeeEstimates?: Record<string, GasData>;
  gasEstimateType?: GasEstimateType;
  primaryCurrency?: string;
  chainId?: string;
  networkClientId?: string;
  addressBook: Record<string, unknown>;
  networkConfigurations: Record<string, unknown>;
  providerRpcTarget?: string;
  showCustomNonce?: boolean;
  shouldUseSmartTransaction?: boolean;
  simulationData?: SimulationData;
  tokensLength?: number;
  accountsLength?: number;
  conversionRate?: string | number | null;
  currentCurrency?: string | number | null;
}

interface DispatchProps {
  setTransactionObject: (transaction: Partial<LegacyTransaction>) => void;
  setNonce: (nonce: string | number) => void;
  setProposedNonce: (nonce: string | number) => void;
}

type Props = OwnProps & StateProps & DispatchProps & IWithMetricsAwarenessProps;

interface EditGasFeeProps {
  selectedGasValue?: unknown;
  initialSuggestedGasLimit?: unknown;
  gasOptions?: unknown;
  onChange?: (...args: never[]) => void;
  primaryCurrency?: unknown;
  chainId?: string;
  onCancel?: () => void;
  onSave?: (...args: never[]) => void;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  view?: string;
  analyticsParams?: Record<string, unknown>;
  onlyGas?: boolean;
  selectedGasObject?: unknown;
  error?: unknown;
  onUpdatingValuesStart?: () => void;
  onUpdatingValuesEnd?: () => void;
}

const EditGasFee1559Component =
  EditGasFee1559 as unknown as ComponentType<EditGasFeeProps>;
const EditGasFeeLegacyComponent =
  EditGasFeeLegacy as unknown as ComponentType<EditGasFeeProps>;
const getGasLimitTyped = getGasLimit as unknown as (
  transaction: unknown,
  skipValidation: boolean,
  networkClientId?: string,
) => Promise<{ gas: string | number }>;
const getApproveNavbarTyped = getApproveNavbar as unknown as (
  title: string,
  navigation: NavigationProp<ParamListBase>,
) => React.ReactNode;
const stopGasPollingTyped = stopGasPolling as unknown as (
  pollToken?: string,
) => Promise<void>;
const updateTransactionTyped = updateTransaction as unknown as (
  transaction: unknown,
) => Promise<void>;
const createLedgerTransactionModalNavDetailsTyped =
  createLedgerTransactionModalNavDetails as unknown as (params: {
    transactionId: string;
    deviceId: string;
    onConfirmationComplete: (approve: boolean) => void;
    type: string;
  }) => [string, Record<string, unknown>];

class Approve extends PureComponent<Props, State> {
  appStateListener?: NativeEventSubscription;

  #transactionFinishedSubscription?: (transactionMeta: TransactionMeta) => void;

  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationProp<ParamListBase>;
  }) =>
    getApproveNavbarTyped('approve.title', navigation);

  state: State = {
    approved: false,
    gasError: undefined,
    ready: false,
    mode: REVIEW,
    over: false,
    analyticsParams: {},
    gasSelected: AppConstants.GAS_OPTIONS.MEDIUM,
    gasSelectedTemp: AppConstants.GAS_OPTIONS.MEDIUM,
    transactionConfirmed: false,
    shouldAddNickname: false,
    shouldVerifyContractDetails: false,
    suggestedGasLimit: undefined,
    eip1559GasObject: {},
    eip1559GasTransaction: {},
    legacyGasObject: {},
    legacyGasTransaction: {},
    isBlockExplorerVisible: false,
    address: '',
    tokenAllowanceState: undefined,
    isGasEstimateStatusIn: false,
    isChangeInSimulationModalOpen: false,
  };

  computeGasEstimates = (
    overrideGasLimit?: string | number | null,
    gasEstimateTypeChanged?: boolean | null,
    ..._ignored: unknown[]
  ) => {
    const { transaction, gasEstimateType } = this.props;

    const gasSelected = gasEstimateTypeChanged
      ? AppConstants.GAS_OPTIONS.MEDIUM
      : this.state.gasSelected;
    const gasSelectedTemp = gasEstimateTypeChanged
      ? AppConstants.GAS_OPTIONS.MEDIUM
      : this.state.gasSelectedTemp;

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const suggestedGasLimit = fromWei(
        overrideGasLimit || transaction.gas,
        'wei',
      );

      this.setState(
        {
          ready: true,
          animateOnChange: true,
          gasSelected,
          gasSelectedTemp,
          suggestedGasLimit,
        },
        () => {
          this.setState({ animateOnChange: false });
        },
      );
    } else {
      const suggestedGasLimit = fromWei(
        overrideGasLimit || transaction.gas,
        'wei',
      );

      this.setState(
        {
          ready: true,
          animateOnChange: true,
          gasSelected,
          gasSelectedTemp,
          suggestedGasLimit,
        },
        () => {
          this.setState({ animateOnChange: false });
        },
      );
    }
  };

  showVerifyContractDetails = () =>
    this.setState({ shouldVerifyContractDetails: true });
  closeVerifyContractDetails = () =>
    this.setState({ shouldVerifyContractDetails: false });

  toggleModal = (val: string) => {
    this.setState({
      shouldAddNickname: !this.state.shouldAddNickname,
      address: val,
    });
  };

  startPolling = async () => {
    const pollToken = await startGasPolling(this.state.pollToken);
    this.setState({ pollToken });
  };

  setNetworkNonce = async () => {
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await (
      getNetworkNonce as unknown as (
        transaction: unknown,
        networkClientId?: string,
      ) => Promise<string | number>
    )(transaction, networkClientId);
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
  };

  componentDidMount = async () => {
    const { showCustomNonce } = this.props;
    if (!this.props?.transaction?.id) {
      this.props.hideModal();
      return null;
    }
    if (!this.props?.transaction?.gas) this.handleGetGasLimit();

    this.startPolling();

    if (showCustomNonce) {
      await this.setNetworkNonce();
    }
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  };

  handleGetGasLimit = async () => {
    const { networkClientId } = this.props;
    const { setTransactionObject, transaction } = this.props;
    const estimation = await getGasLimitTyped(
      { ...transaction, gas: undefined },
      false,
      networkClientId,
    );
    setTransactionObject({ gas: estimation.gas });
  };

  componentDidUpdate = (prevProps: Props) => {
    const { transaction } = this.props;

    const gasEstimateTypeChanged =
      prevProps.gasEstimateType !== this.props.gasEstimateType;

    if (
      (!this.state.stopUpdateGas && !this.state.advancedGasInserted) ||
      gasEstimateTypeChanged
    ) {
      if (
        this.props.gasFeeEstimates &&
        transaction.gas &&
        (!shallowEqual(
          prevProps.gasFeeEstimates as Record<string, unknown>,
          this.props.gasFeeEstimates,
        ) ||
          !(transaction.gas as { eq: (value: unknown) => boolean }).eq(
            prevProps?.transaction?.gas,
          ) ||
          !this.state.ready)
      ) {
        this.computeGasEstimates(null, null, gasEstimateTypeChanged);
      }
    }
  };

  componentWillUnmount = async () => {
    const { approved } = this.state;
    const { transaction } = this.props;

    await stopGasPollingTyped(this.state.pollToken);

    const isLedgerAccount = isHardwareAccount(transaction.from as string, [
      ExtendedKeyringTypes.ledger,
    ]);

    this.appStateListener?.remove();
    if (!isLedgerAccount) {
      Engine.controllerMessenger.tryUnsubscribe(
        'TransactionController:transactionFinished',
        this.#transactionFinishedSubscription,
      );

      if (!approved)
        Engine.rejectPendingApproval(
          transaction.id as string,
          providerErrors.userRejectedRequest(),
          {
            ignoreMissing: true,
            logErrors: false,
          },
        );
    }
  };

  handleAppStateChange = (appState: AppStateStatus) => {
    if (appState !== 'active') {
      const { transaction } = this.props;
      Engine.rejectPendingApproval(
        transaction?.id as string,
        providerErrors.userRejectedRequest(),
        {
          ignoreMissing: true,
          logErrors: false,
        },
      );

      this.props.hideModal();
    }
  };

  cancelGasEdition = () => {
    this.setState({
      stopUpdateGas: false,
    });
    this.review();
  };

  saveGasEditionLegacy = (
    legacyGasTransaction: GasData,
    legacyGasObject: GasData,
  ) => {
    legacyGasTransaction.error = this.validateGas(
      legacyGasTransaction.totalHex as string,
    );
    this.setState({
      stopUpdateGas: false,
      legacyGasTransaction,
      legacyGasObject,
    });
    this.review();
  };

  saveGasEdition = (
    eip1559GasTransaction: GasData,
    eip1559GasObject: GasData,
  ) => {
    this.setState({ eip1559GasTransaction, eip1559GasObject });
    this.review();
  };

  validateGas = (total: string) => {
    let error;
    const {
      ticker,
      transaction: { from },
      accounts,
    } = this.props;

    const fromAccount = accounts[safeToChecksumAddress(from as string) as string];

    const weiBalance = hexToBN(fromAccount.balance);
    const totalTransactionValue = hexToBN(total);
    if (!weiBalance.gte(totalTransactionValue)) {
      const amount = renderFromWei(totalTransactionValue.sub(weiBalance));
      const tokenSymbol = getTicker(ticker);
      error = strings('transaction.insufficient_amount', {
        amount,
        tokenSymbol,
      });
    }

    return error;
  };

  prepareTransaction = () => {
    const { gasEstimateType, showCustomNonce, transaction } = this.props;

    const {
      legacyGasTransaction: gasDataLegacy,
      eip1559GasTransaction: gasDataEIP1559,
    } = this.state;

    return buildTransactionParams({
      gasDataEIP1559,
      gasDataLegacy,
      gasEstimateType: gasEstimateType ?? GAS_ESTIMATE_TYPES.NONE,
      showCustomNonce: showCustomNonce ?? false,
      transaction,
    });
  };

  getAnalyticsParams = () => {
    try {
      const { gasEstimateType } = this.props;
      const { analyticsParams, gasSelected } = this.state;
      return {
        ...analyticsParams,
        gas_estimate_type: gasEstimateType,
        gas_mode: gasSelected ? 'Basic' : 'Advanced',
        speed_set: gasSelected || undefined,
      };
    } catch (error) {
      return {};
    }
  };

  onLedgerConfirmation = (
    approve: boolean,
    _transactionId: string,
    gaParams: Record<string, unknown>,
  ) => {
    const { metrics } = this.props;
    try {
      //manual cancel from UI when transaction is awaiting from ledger confirmation
      if (!approve) {
        //cancelTransaction will change transaction status to reject and throw error from event listener
        //component is being unmounted, error will be unhandled, hence remove listener before cancel
        Engine.controllerMessenger.tryUnsubscribe(
          'TransactionController:transactionFinished',
          this.#transactionFinishedSubscription,
        );

        metrics.trackEvent(
          metrics
            .createEventBuilder(MetaMetricsEvents.APPROVAL_CANCELLED)
            .addProperties(gaParams as unknown as JsonMap)
            .build(),
        );

        NotificationManager.showSimpleNotification({
          status: `simple_notification_rejected`,
          duration: 5000,
          title: strings('notifications.wc_sent_tx_rejected_title'),
          description: strings('notifications.wc_description'),
        });
      }
    } finally {
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(gaParams as unknown as JsonMap)
          .build(),
      );
    }
  };

  onConfirm = async () => {
    const { KeyringController, ApprovalController } = Engine.context;
    const {
      transactions,
      gasEstimateType,
      metrics,
      chainId,
      shouldUseSmartTransaction,
      simulationData: { isUpdatedAfterSecurityCheck } = {},
      navigation,
    } = this.props;
    const {
      legacyGasTransaction,
      transactionConfirmed,
      eip1559GasTransaction,
    } = this.state;

    if (isUpdatedAfterSecurityCheck) {
      this.setState({ isChangeInSimulationModalOpen: true });

      navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.CHANGE_IN_SIMULATION_MODAL,
        params: {
          onProceed: () => {
            this.setState({ isChangeInSimulationModalOpen: false });
            this.setState({ transactionConfirmed: false });
          },
          onReject: () => {
            this.setState({ isChangeInSimulationModalOpen: false });
            this.onCancel();
          },
        },
      });
      return;
    }

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      if (this.validateGas(eip1559GasTransaction.totalMaxHex as string)) return;
    } else if (this.validateGas(legacyGasTransaction.totalHex as string)) return;
    if (transactionConfirmed) return;

    this.setState({ transactionConfirmed: true });

    try {
      const transaction = this.prepareTransaction() as LegacyTransaction;
      const isLedgerAccount = isHardwareAccount(transaction.from as string, [
        ExtendedKeyringTypes.ledger,
      ]);

      this.#transactionFinishedSubscription =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta) => {
            if (transactionMeta.status === 'submitted') {
              if (!isLedgerAccount) {
                this.setState({ approved: true });
                this.props.hideModal();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: 'ETH',
              });
            } else {
              Logger.error(
                transactionMeta.error as unknown as Error,
                'error while trying to finish a transaction (Approve)',
              );
            }
          },
          (transactionMeta) => transactionMeta.id === transaction.id,
        );

      const fullTx = (transactions as TransactionMeta[]).find(
        ({ id }) => id === transaction.id,
      ) as TransactionMeta;

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...fullTx.txParams,
          ...transaction,
          chainId,
        },
      };
      await updateTransactionTyped(updatedTx);
      await KeyringController.resetQRKeyringState();

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetailsTyped({
            transactionId: transaction.id as string,
            deviceId,
            onConfirmationComplete: (approve) =>
              this.onLedgerConfirmation(
                approve,
                transaction.id as string,
                this.getAnalyticsParams(),
              ),
            type: 'signTransaction',
          }),
        );
        this.props.hideModal();
        return;
      }

      await ApprovalController.accept(transaction.id as string, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        this.props.hideModal();
      }
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(this.getAnalyticsParams() as unknown as JsonMap)
          .build(),
      );
    } catch (error) {
      const err = error as Error;
      if (
        !err.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !err.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          err.message,
          [{ text: 'OK' }],
        );
        Logger.error(err, 'error while trying to send transaction (Approve)');
        this.setState({ transactionHandled: true });
        this.props.hideModal();
      } else {
        metrics.trackEvent(
          metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
      this.setState({ transactionHandled: false });
    }
    this.setState({ transactionConfirmed: true });
  };

  onCancel = () => {
    const { metrics, hideModal } = this.props;
    Engine.rejectPendingApproval(
      this.props.transaction.id as string,
      providerErrors.userRejectedRequest(),
      {
        ignoreMissing: true,
        logErrors: false,
      },
    );
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.APPROVAL_CANCELLED)
        .addProperties(this.getAnalyticsParams() as unknown as JsonMap)
        .build(),
    );
    hideModal();

    NotificationManager.showSimpleNotification({
      status: `simple_notification_rejected`,
      duration: 5000,
      title: strings('notifications.approved_tx_rejected_title'),
      description: strings('notifications.wc_description'),
    });
  };

  review = () => {
    this.onModeChange(REVIEW);
  };

  onModeChange = (mode: string) => {
    const { metrics } = this.props;
    this.setState({ mode });
    if (mode === EDIT) {
      metrics.trackEvent(
        metrics
          .createEventBuilder(
            MetaMetricsEvents.SEND_FLOW_ADJUSTS_TRANSACTION_FEE,
          )
          .build(),
      );
    }
  };

  setAnalyticsParams = (analyticsParams: Record<string, unknown>) => {
    this.setState({ analyticsParams });
  };

  getGasAnalyticsParams = () => {
    try {
      const { analyticsParams } = this.state;
      const { gasEstimateType } = this.props;
      return {
        dapp_host_name: analyticsParams?.dapp_host_name,
        active_currency: {
          value: analyticsParams?.active_currency,
          anonymous: true,
        },
        gas_estimate_type: gasEstimateType,
      };
    } catch (error) {
      return {};
    }
  };

  updateGasSelected = (selected: string | null) => {
    this.setState({
      stopUpdateGas: !selected,
      gasSelectedTemp: selected,
      gasSelected: selected,
    });
  };

  onUpdatingValuesStart = () => {
    this.setState({ isAnimating: true });
  };
  onUpdatingValuesEnd = () => {
    this.setState({ isAnimating: false });
  };

  updateTransactionState = (gas: GasData) => {
    const gasError = this.validateGas(gas.totalMaxHex || gas.totalHex || '0x0');

    this.setState({
      eip1559GasTransaction: gas,
      legacyGasTransaction: gas,
      isGasEstimateStatusIn: true,
      gasError,
    });
  };

  setIsBlockExplorerVisible = () => {
    this.setState({
      isBlockExplorerVisible: !this.state.isBlockExplorerVisible,
    });
  };

  updateTokenAllowanceState = (value: Record<string, unknown>) => {
    this.setState({ tokenAllowanceState: value });
  };

  render = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    const {
      mode,
      ready,
      over,
      gasSelected,
      animateOnChange,
      isAnimating,
      transactionConfirmed,
      eip1559GasObject,
      eip1559GasTransaction,
      legacyGasObject,
      gasError,
      address,
      shouldAddNickname,
      tokenAllowanceState,
      isGasEstimateStatusIn,
      legacyGasTransaction,
      isChangeInSimulationModalOpen,
    } = this.state;

    const {
      transaction,
      addressBook,
      gasEstimateType,
      gasFeeEstimates,
      primaryCurrency,
      chainId,
      providerType,
      providerRpcTarget,
      networkConfigurations,
    } = this.props;

    const selectedGasObject = {
      suggestedMaxFeePerGas:
        eip1559GasObject.suggestedMaxFeePerGas ||
        gasFeeEstimates?.[gasSelected as string]?.suggestedMaxFeePerGas,
      suggestedMaxPriorityFeePerGas:
        eip1559GasObject.suggestedMaxPriorityFeePerGas ||
        gasFeeEstimates?.[gasSelected as string]?.suggestedMaxPriorityFeePerGas,
      suggestedGasLimit:
        eip1559GasObject.suggestedGasLimit ||
        eip1559GasTransaction.suggestedGasLimit,
    };

    const selectedLegacyGasObject = {
      legacyGasLimit: legacyGasObject?.legacyGasLimit,
      suggestedGasPrice: legacyGasObject?.suggestedGasPrice,
    };

    const savedContactList = checkIfAddressIsSaved(
      addressBook as unknown as Parameters<typeof checkIfAddressIsSaved>[0],
      chainId as string,
      transaction as unknown as Parameters<typeof checkIfAddressIsSaved>[2],
    );

    const savedContactListToArray = Object.values(addressBook).flatMap(
      (value) => Object.values(value as Record<string, unknown>),
    ) as { address?: string; name?: string }[];

    let addressNickname = '';

    const filteredSavedContactList = savedContactListToArray.filter(
      (contact) => contact.address === safeToChecksumAddress(address as string),
    );

    if (filteredSavedContactList.length > 0) {
      addressNickname = filteredSavedContactList[0].name ?? '';
    }

    if (!transaction.id) return null;
    return (
      <Modal
        isVisible={this.props.modalVisible && !isChangeInSimulationModalOpen}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={
          this.state.shouldAddNickname
            ? styles.updateNickView
            : styles.bottomModal
        }
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
        animationInTiming={600}
        animationOutTiming={600}
        onBackdropPress={this.onCancel}
        onBackButtonPress={this.onCancel}
        onSwipeComplete={this.onCancel}
        swipeDirection={'down'}
        propagateSwipe
      >
        {shouldAddNickname ? (
          <AddNickname
            closeModal={() => this.toggleModal(address)}
            address={address}
            addressNickname={addressNickname}
            providerType={providerType as string}
            providerChainId={chainId as `0x${string}`}
            providerRpcTarget={providerRpcTarget}
            providerNetwork={providerType as string}
            nicknameExists={Boolean(addressNickname)}
            networkConfigurations={
              networkConfigurations as unknown as React.ComponentProps<
                typeof AddNickname
              >['networkConfigurations']
            }
          />
        ) : this.state.isBlockExplorerVisible && !isNonEvmChainId(chainId as string) ? (
          <ShowBlockExplorer
            setIsBlockExplorerVisible={this.setIsBlockExplorerVisible}
            type={providerType as string}
            address={transaction.to as string}
            headerWrapperStyle={styles.headerWrapper}
            headerTextStyle={styles.headerText}
            iconStyle={styles.icon}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={
              networkConfigurations as unknown as React.ComponentProps<
                typeof ShowBlockExplorer
              >['networkConfigurations']
            }
          />
        ) : (
          <KeyboardAwareScrollView
            contentContainerStyle={styles.keyboardAwareWrapper}
          >
            {mode === 'review' && (
              <AnimatedTransactionModal
                onModeChange={this.onModeChange}
                ready={ready}
                review={this.review}
              >
                <ApproveTransactionReview
                  gasError={gasError}
                  onCancel={this.onCancel}
                  onConfirm={this.onConfirm}
                  over={over}
                  gasSelected={gasSelected}
                  onSetAnalyticsParams={this.setAnalyticsParams}
                  gasEstimateType={gasEstimateType}
                  onUpdatingValuesStart={this.onUpdatingValuesStart}
                  onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                  animateOnChange={animateOnChange}
                  isAnimating={isAnimating}
                  gasEstimationReady={ready}
                  savedContactListToArray={savedContactListToArray}
                  transactionConfirmed={transactionConfirmed}
                  showBlockExplorer={this.setIsBlockExplorerVisible}
                  toggleModal={this.toggleModal}
                  showVerifyContractDetails={this.showVerifyContractDetails}
                  shouldVerifyContractDetails={
                    this.state.shouldVerifyContractDetails
                  }
                  closeVerifyContractDetails={this.closeVerifyContractDetails}
                  nicknameExists={savedContactList && !!savedContactList.length}
                  nickname={
                    savedContactList && savedContactList.length > 0
                      ? savedContactList[0].nickname
                      : ''
                  }
                  chainId={chainId}
                  updateTokenAllowanceState={this.updateTokenAllowanceState}
                  tokenAllowanceState={tokenAllowanceState}
                  updateTransactionState={this.updateTransactionState}
                  legacyGasObject={this.state.legacyGasObject}
                  eip1559GasObject={this.state.eip1559GasObject}
                  isGasEstimateStatusIn={isGasEstimateStatusIn}
                />
                {/** View fixes layout issue after removing <CustomGas/> */}
                <View />
              </AnimatedTransactionModal>
            )}

            {mode !== 'review' &&
              (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ? (
                <EditGasFee1559Component
                  selectedGasValue={gasSelected}
                  initialSuggestedGasLimit={this.state.suggestedGasLimit}
                  gasOptions={gasFeeEstimates}
                  onChange={this.updateGasSelected}
                  primaryCurrency={primaryCurrency}
                  chainId={chainId}
                  onCancel={this.cancelGasEdition}
                  onSave={this.saveGasEdition}
                  animateOnChange={animateOnChange}
                  isAnimating={isAnimating}
                  view={'Approve'}
                  analyticsParams={this.getGasAnalyticsParams()}
                  onlyGas
                  selectedGasObject={selectedGasObject}
                />
              ) : (
                <EditGasFeeLegacyComponent
                  onCancel={this.cancelGasEdition}
                  onSave={this.saveGasEditionLegacy}
                  animateOnChange={animateOnChange}
                  isAnimating={isAnimating}
                  view={'Approve'}
                  analyticsParams={this.getGasAnalyticsParams()}
                  onlyGas
                  selectedGasObject={selectedLegacyGasObject}
                  error={legacyGasTransaction.error}
                  onUpdatingValuesStart={this.onUpdatingValuesStart}
                  onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                  chainId={chainId}
                />
              ))}
          </KeyboardAwareScrollView>
        )}
        <GlobalAlert />
      </Modal>
    );
  };
}

const mapStateToProps = (state: RootState): StateProps => {
  const transaction = getNormalizedTxState(
    state,
  ) as unknown as LegacyTransaction;
  const chainId = transaction?.chainId as Hex;
  const networkClientId = transaction?.networkId;

  return {
    accounts: selectAccounts(state),
    ticker: selectNativeCurrencyByChainId(state, chainId),
    transaction,
    transactions: selectTransactions(state),
    tokensLength: selectTokensLength(state),
    accountsLength: selectAccountsLength(state),
    primaryCurrency: selectPrimaryCurrency(state) as unknown as string,
    chainId,
    networkClientId,
    gasFeeEstimates: selectGasFeeEstimates(
      state,
    ) as unknown as Record<string, GasData>,
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    showCustomNonce: selectShowCustomNonce(state) as unknown as boolean,
    addressBook: selectAddressBook(state),
    providerType: selectProviderTypeByChainId(state, chainId),
    providerRpcTarget: selectRpcUrlByChainId(state, chainId),
    networkConfigurations: selectEvmNetworkConfigurationsByChainId(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    simulationData: selectCurrentTransactionMetadata(state)?.simulationData,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setTransactionObject: (transaction) =>
    dispatch(setTransactionObjectAction(transaction)),
  setNonce: (nonce) => dispatch(setNonceAction(nonce)),
  setProposedNonce: (nonce) => dispatch(setProposedNonceAction(nonce)),
});

Approve.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(
  Approve as unknown as ComponentType<IWithMetricsAwarenessProps>,
)) as ComponentType<Partial<Props>>;
