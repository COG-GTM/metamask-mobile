import React, { PureComponent } from 'react';
import { Alert, AppState, View } from 'react-native';
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
  setTransactionObject,
  setNonce,
  setProposedNonce,
} from '../../../../../actions/transaction';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectEvmChainId,
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

const EDIT = 'edit';
const REVIEW = 'review';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressBook?: any;
  chainId?: string;
  gasEstimateType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasFeeEstimates?: any;
  hideModal?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalVisible?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkClientId?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkConfigurations?: any;
  primaryCurrency?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providerRpcTarget?: any;
  providerType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNonce?: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProposedNonce?: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject?: (tx: any) => void;
  showCustomNonce?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: any;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  advancedGasInserted: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyticsParams: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animateOnChange: any;
  approved: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eip1559GasObject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eip1559GasTransaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasDataEIP1559: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasDataLegacy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasError: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasSelected: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasSelectedTemp: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isAnimating: any;
  isBlockExplorerVisible: boolean;
  isChangeInSimulationModalOpen: boolean;
  isGasEstimateStatusIn: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasObject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legacyGasTransaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mode: any;
  over: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pollToken: any;
  ready: boolean;
  shouldAddNickname: boolean;
  shouldVerifyContractDetails: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopUpdateGas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestedGasLimit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenAllowanceState: any;
  transactionConfirmed: boolean;
}

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
class Approve extends PureComponent<Props, State> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appStateListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #transactionFinishedSubscription: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static navigationOptions = ({ navigation }: any) =>
    // @ts-expect-error Legacy JS migration
    getApproveNavbar('approve.title', navigation);

  // @ts-expect-error Legacy JS migration
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeGasEstimates = (overrideGasLimit: any, gasEstimateTypeChanged: any) => {
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

      // eslint-disable-next-line react/no-did-update-set-state
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

      // eslint-disable-next-line react/no-did-update-set-state
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleModal = (val: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(transaction, networkClientId);
    // @ts-expect-error Legacy JS migration
    setNonce(proposedNonce);
    // @ts-expect-error Legacy JS migration
    setProposedNonce(proposedNonce);
  };

  componentDidMount = async () => {
    const { showCustomNonce } = this.props;
    if (!this.props?.transaction?.id) {
      // @ts-expect-error Legacy JS migration
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { setTransactionObject, transaction } = this.props;
    const estimation = await getGasLimit(
      { ...transaction, gas: undefined },
      false,
      networkClientId,
    );
    // @ts-expect-error Legacy JS migration
    setTransactionObject({ gas: estimation.gas });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidUpdate = (prevProps: any) => {
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
        (!shallowEqual(prevProps.gasFeeEstimates, this.props.gasFeeEstimates) ||
          !transaction.gas.eq(prevProps?.transaction?.gas) ||
          !this.state.ready)
      ) {
        // @ts-expect-error Legacy JS migration
        this.computeGasEstimates(null, null, gasEstimateTypeChanged);
      }
    }
  };

  componentWillUnmount = async () => {
    const { approved } = this.state;
    const { transaction } = this.props;

    // @ts-expect-error Legacy JS migration
    await stopGasPolling(this.state.pollToken);

    const isLedgerAccount = isHardwareAccount(transaction.from, [
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
          transaction.id,
          providerErrors.userRejectedRequest(),
          {
            ignoreMissing: true,
            logErrors: false,
          },
        );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleAppStateChange = (appState: any) => {
    if (appState !== 'active') {
      const { transaction } = this.props;
      Engine.rejectPendingApproval(
        transaction?.id,
        providerErrors.userRejectedRequest(),
        {
          ignoreMissing: true,
          logErrors: false,
        },
      );

      // @ts-expect-error Legacy JS migration
      this.props.hideModal();
    }
  };

  cancelGasEdition = () => {
    this.setState({
      stopUpdateGas: false,
    });
    this.review();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveGasEditionLegacy = (legacyGasTransaction: any, legacyGasObject: any) => {
    legacyGasTransaction.error = this.validateGas(
      legacyGasTransaction.totalHex,
    );
    this.setState({
      stopUpdateGas: false,
      legacyGasTransaction,
      legacyGasObject,
    });
    this.review();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveGasEdition = (eip1559GasTransaction: any, eip1559GasObject: any) => {
    this.setState({ eip1559GasTransaction, eip1559GasObject });
    this.review();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateGas = (total: any) => {
    let error;
    const {
      ticker,
      transaction: { from },
      accounts,
    } = this.props;

    // @ts-expect-error Legacy JS migration
    const fromAccount = accounts[safeToChecksumAddress(from)];

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
      // @ts-expect-error Legacy JS migration
      gasEstimateType,
      // @ts-expect-error Legacy JS migration
      showCustomNonce,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  onLedgerConfirmation = (approve: any, transactionId: any, gaParams: any) => {
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
            .addProperties(gaParams)
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
          .addProperties(gaParams)
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
      // @ts-expect-error Legacy JS migration
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
      if (this.validateGas(eip1559GasTransaction.totalMaxHex)) return;
    } else if (this.validateGas(legacyGasTransaction.totalHex)) return;
    if (transactionConfirmed) return;

    this.setState({ transactionConfirmed: true });

    try {
      const transaction = this.prepareTransaction();
      const isLedgerAccount = isHardwareAccount(transaction.from, [
        ExtendedKeyringTypes.ledger,
      ]);

      this.#transactionFinishedSubscription =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta) => {
            if (transactionMeta.status === 'submitted') {
              if (!isLedgerAccount) {
                this.setState({ approved: true });
                // @ts-expect-error Legacy JS migration
                this.props.hideModal();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: 'ETH',
              });
            } else {
              Logger.error(
                // @ts-expect-error Legacy JS migration
                transactionMeta.error,
                'error while trying to finish a transaction (Approve)',
              );
            }
          },
          // @ts-expect-error Legacy JS migration
          (transactionMeta) => transactionMeta.id === transaction.id,
        );

      // @ts-expect-error Legacy JS migration
      const fullTx = transactions.find(({ id }) => id === transaction.id);

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...fullTx.txParams,
          ...transaction,
          chainId,
        },
      };
      // @ts-expect-error Legacy JS migration
      await updateTransaction(updatedTx);
      await KeyringController.resetQRKeyringState();

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            // @ts-expect-error Legacy JS migration
            transactionId: transaction.id,
            deviceId,
            onConfirmationComplete: (approve) =>
              this.onLedgerConfirmation(
                approve,
                // @ts-expect-error Legacy JS migration
                transaction.id,
                this.getAnalyticsParams(),
              ),
            // @ts-expect-error Legacy JS migration
            type: 'signTransaction',
          }),
        );
        // @ts-expect-error Legacy JS migration
        this.props.hideModal();
        return;
      }

      // @ts-expect-error Legacy JS migration
      await ApprovalController.accept(transaction.id, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        // @ts-expect-error Legacy JS migration
        this.props.hideModal();
      }
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(this.getAnalyticsParams())
          .build(),
      );
    } catch (error) {
      if (
        // @ts-expect-error Legacy JS migration
        !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        // @ts-expect-error Legacy JS migration
        !error?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          // @ts-expect-error Legacy JS migration
          error?.message,
          [{ text: 'OK' }],
        );
        // @ts-expect-error Legacy JS migration
        Logger.error(error, 'error while trying to send transaction (Approve)');
        this.setState({ transactionHandled: true });
        // @ts-expect-error Legacy JS migration
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
      this.props.transaction.id,
      providerErrors.userRejectedRequest(),
      {
        ignoreMissing: true,
        logErrors: false,
      },
    );
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.APPROVAL_CANCELLED)
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
    // @ts-expect-error Legacy JS migration
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onModeChange = (mode: any) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAnalyticsParams = (analyticsParams: any) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateGasSelected = (selected: any) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransactionState = (gas: any) => {
    const gasError = this.validateGas(gas.totalMaxHex || gas.totalHex);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTokenAllowanceState = (value: any) => {
    this.setState({ tokenAllowanceState: value });
  };

  render = () => {
    // @ts-expect-error Legacy JS migration
    const colors = this.context.colors || mockTheme.colors;
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
        gasFeeEstimates[gasSelected]?.suggestedMaxFeePerGas,
      suggestedMaxPriorityFeePerGas:
        eip1559GasObject.suggestedMaxPriorityFeePerGas ||
        gasFeeEstimates[gasSelected]?.suggestedMaxPriorityFeePerGas,
      suggestedGasLimit:
        eip1559GasObject.suggestedGasLimit ||
        eip1559GasTransaction.suggestedGasLimit,
    };

    const selectedLegacyGasObject = {
      legacyGasLimit: legacyGasObject?.legacyGasLimit,
      suggestedGasPrice: legacyGasObject?.suggestedGasPrice,
    };

    const savedContactList = checkIfAddressIsSaved(
      addressBook,
      // @ts-expect-error Legacy JS migration
      chainId,
      transaction,
    );

    const savedContactListToArray = Object.values(addressBook).flatMap(
      // @ts-expect-error Legacy JS migration
      (value) => Object.values(value),
    );

    let addressNickname = '';

    const filteredSavedContactList = savedContactListToArray.filter(
      // @ts-expect-error Legacy JS migration
      (contact) => contact.address === safeToChecksumAddress(address),
    );

    if (filteredSavedContactList.length > 0) {
      // @ts-expect-error Legacy JS migration
      addressNickname = filteredSavedContactList[0].name;
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
            // @ts-expect-error Legacy JS migration
            closeModal={this.toggleModal}
            address={address}
            savedContactListToArray={savedContactListToArray}
            addressNickname={addressNickname}
            // @ts-expect-error Legacy JS migration
            providerType={providerType}
            // @ts-expect-error Legacy JS migration
            providerChainId={chainId}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={networkConfigurations}
          />
        // @ts-expect-error Legacy JS migration
        ) : this.state.isBlockExplorerVisible && !isNonEvmChainId(chainId) ? (
          <ShowBlockExplorer
            setIsBlockExplorerVisible={this.setIsBlockExplorerVisible}
            // @ts-expect-error Legacy JS migration
            type={providerType}
            address={transaction.to}
            headerWrapperStyle={styles.headerWrapper}
            headerTextStyle={styles.headerText}
            iconStyle={styles.icon}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={networkConfigurations}
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
                {/* @ts-expect-error Legacy JS migration */}
                <ApproveTransactionReview
                  // @ts-expect-error Legacy JS migration
                  gasError={gasError}
                  // @ts-expect-error Legacy JS migration
                  onCancel={this.onCancel}
                  // @ts-expect-error Legacy JS migration
                  onConfirm={this.onConfirm}
                  // @ts-expect-error Legacy JS migration
                  over={over}
                  // @ts-expect-error Legacy JS migration
                  gasSelected={gasSelected}
                  // @ts-expect-error Legacy JS migration
                  onSetAnalyticsParams={this.setAnalyticsParams}
                  // @ts-expect-error Legacy JS migration
                  gasEstimateType={gasEstimateType}
                  // @ts-expect-error Legacy JS migration
                  onUpdatingValuesStart={this.onUpdatingValuesStart}
                  // @ts-expect-error Legacy JS migration
                  onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                  // @ts-expect-error Legacy JS migration
                  animateOnChange={animateOnChange}
                  // @ts-expect-error Legacy JS migration
                  isAnimating={isAnimating}
                  // @ts-expect-error Legacy JS migration
                  gasEstimationReady={ready}
                  // @ts-expect-error Legacy JS migration
                  savedContactListToArray={savedContactListToArray}
                  // @ts-expect-error Legacy JS migration
                  transactionConfirmed={transactionConfirmed}
                  // @ts-expect-error Legacy JS migration
                  showBlockExplorer={this.setIsBlockExplorerVisible}
                  // @ts-expect-error Legacy JS migration
                  toggleModal={this.toggleModal}
                  // @ts-expect-error Legacy JS migration
                  showVerifyContractDetails={this.showVerifyContractDetails}
                  // @ts-expect-error Legacy JS migration
                  shouldVerifyContractDetails={
                    this.state.shouldVerifyContractDetails
                  }
                  // @ts-expect-error Legacy JS migration
                  closeVerifyContractDetails={this.closeVerifyContractDetails}
                  // @ts-expect-error Legacy JS migration
                  nicknameExists={savedContactList && !!savedContactList.length}
                  // @ts-expect-error Legacy JS migration
                  nickname={
                    savedContactList && savedContactList.length > 0
                      ? savedContactList[0].nickname
                      : ''
                  }
                  // @ts-expect-error Legacy JS migration
                  chainId={chainId}
                  // @ts-expect-error Legacy JS migration
                  updateTokenAllowanceState={this.updateTokenAllowanceState}
                  // @ts-expect-error Legacy JS migration
                  tokenAllowanceState={tokenAllowanceState}
                  // @ts-expect-error Legacy JS migration
                  updateTransactionState={this.updateTransactionState}
                  // @ts-expect-error Legacy JS migration
                  legacyGasObject={this.state.legacyGasObject}
                  // @ts-expect-error Legacy JS migration
                  eip1559GasObject={this.state.eip1559GasObject}
                  // @ts-expect-error Legacy JS migration
                  isGasEstimateStatusIn={isGasEstimateStatusIn}
                />
                {/** View fixes layout issue after removing <CustomGas/> */}
                <View />
              </AnimatedTransactionModal>
            )}

            {mode !== 'review' &&
              (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ? (
                <EditGasFee1559
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
                <EditGasFeeLegacy
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => {
  const transaction = getNormalizedTxState(state);
  const chainId = transaction?.chainId;
  const networkClientId = transaction?.networkId;

  return {
    accounts: selectAccounts(state),
    ticker: selectNativeCurrencyByChainId(state, chainId),
    transaction,
    transactions: selectTransactions(state),
    tokensLength: selectTokensLength(state),
    accountsLength: selectAccountsLength(state),
    primaryCurrency: selectPrimaryCurrency(state),
    chainId,
    networkClientId,
    gasFeeEstimates: selectGasFeeEstimates(state),
    gasEstimateType: selectGasFeeControllerEstimateType(state),
    conversionRate: selectConversionRateByChainId(state, chainId),
    currentCurrency: selectCurrentCurrency(state),
    showCustomNonce: selectShowCustomNonce(state),
    addressBook: selectAddressBook(state),
    providerType: selectProviderTypeByChainId(state, chainId),
    providerRpcTarget: selectRpcUrlByChainId(state, chainId),
    networkConfigurations: selectEvmNetworkConfigurationsByChainId(state),
    shouldUseSmartTransaction: selectShouldUseSmartTransaction(state, chainId),
    simulationData: selectCurrentTransactionMetadata(state)?.simulationData,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNonce: (nonce: any) => dispatch(setNonce(nonce)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProposedNonce: (nonce: any) => dispatch(setProposedNonce(nonce)),
});

Approve.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error Legacy JS migration
)(withMetricsAwareness(Approve));
