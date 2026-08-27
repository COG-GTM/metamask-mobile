/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import { Alert, AppState, View } from 'react-native';
import { getApproveNavbar } from '../../../../../UI/Navbar';
import { connect } from 'react-redux';
import {
  safeToChecksumAddress,
  isHardwareAccount,
} from '../../../../../../util/address';
import Engine from '../../../../../../core/Engine';
import AnimatedTransactionModal from '../../../../../UI/AnimatedTransactionModal';
import ApproveTransactionReview from '../../components/ApproveTransactionReview';
import AddNickname from '../../components/ApproveTransactionReview/AddNickname';
import Modal from 'react-native-modal';
import { strings } from '../../../../../../../locales/i18n';

import {
  setTransactionObject,
  setNonce,
  setProposedNonce,
} from '../../../../../../actions/transaction';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { fromWei, renderFromWei, hexToBN } from '../../../../../../util/number';
import {
  getNormalizedTxState,
  getTicker,
} from '../../../../../../util/transactions';
import { getGasLimit } from '../../../../../../util/custom-gas';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import NotificationManager from '../../../../../../core/NotificationManager';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import Logger from '../../../../../../util/Logger';
import EditGasFee1559 from '../../components/EditGasFee1559Update';
import EditGasFeeLegacy from '../../components/EditGasFeeLegacyUpdate';
import AppConstants from '../../../../../../core/AppConstants';
import { shallowEqual } from '../../../../../../util/general';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import GlobalAlert from '../../../../../UI/GlobalAlert';
import checkIfAddressIsSaved from '../../../../../../util/checkAddress';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { createLedgerTransactionModalNavDetails } from '../../../../../UI/LedgerModals/LedgerTransactionModal';
import {
  startGasPolling,
  stopGasPolling,
} from '../../../../../../core/GasPolling/GasPolling';
import {
  selectNativeCurrencyByChainId,
  selectEvmNetworkConfigurationsByChainId,
  selectProviderTypeByChainId,
  selectRpcUrlByChainId,
  selectEvmChainId,
} from '../../../../../../selectors/networkController';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../selectors/currencyRateController';
import { selectTokensLength } from '../../../../../../selectors/tokensController';
import {
  selectAccounts,
  selectAccountsLength,
} from '../../../../../../selectors/accountTrackerController';
import ShowBlockExplorer from '../../components/ApproveTransactionReview/ShowBlockExplorer';
import createStyles from './styles';
import { providerErrors } from '@metamask/rpc-errors';
import { getDeviceId } from '../../../../../../core/Ledger/Ledger';
import ExtendedKeyringTypes from '../../../../../../constants/keyringTypes';
import {
  getNetworkNonce,
  updateTransaction,
} from '../../../../../../util/transaction-controller';
import { withMetricsAwareness } from '../../../../../../components/hooks/useMetrics';
import {
  selectGasFeeEstimates,
  selectCurrentTransactionMetadata,
} from '../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../selectors/gasFeeController';
import { selectShouldUseSmartTransaction } from '../../../../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../../../../util/smart-transactions/smart-publish-hook';
import { selectTransactions } from '../../../../../../selectors/transactionController';
import {
  selectPrimaryCurrency,
  selectShowCustomNonce,
} from '../../../../../../selectors/settings';
import { selectAddressBook } from '../../../../../../selectors/addressBookController';
import { buildTransactionParams } from '../../../../../../util/confirmation/transactions';
import Routes from '../../../../../../constants/navigation/Routes';
import { isNonEvmChainId } from '../../../../../../core/Multichain/utils';

const EDIT = 'edit';
const REVIEW = 'review';

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
class Approve extends PureComponent {
  // @ts-expect-error -- legacy JavaScript UI type boundary
  appStateListener;

  // @ts-expect-error -- legacy JavaScript UI type boundary
  #transactionFinishedSubscription;

  // @ts-expect-error -- legacy JavaScript UI type boundary
  static navigationOptions = ({ navigation }) =>
    // @ts-expect-error -- legacy JavaScript UI type boundary
    getApproveNavbar('approve.title', navigation);

  state = {
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  computeGasEstimates = (overrideGasLimit, gasEstimateTypeChanged) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  toggleModal = (val) => {
    this.setState({
      shouldAddNickname: !this.state.shouldAddNickname,
      address: val,
    });
  };

  startPolling = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const pollToken = await startGasPolling(this.state.pollToken);
    this.setState({ pollToken });
  };

  setNetworkNonce = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(transaction, networkClientId);
    setNonce(proposedNonce);
    setProposedNonce(proposedNonce);
  };

  componentDidMount = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { showCustomNonce } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    if (!this.props?.transaction?.id) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.hideModal();
      return null;
    }
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { networkClientId } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { setTransactionObject, transaction } = this.props;
    const estimation = await getGasLimit(
      { ...transaction, gas: undefined },
      false,
      networkClientId,
    );
    setTransactionObject({ gas: estimation.gas });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  componentDidUpdate = (prevProps) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction } = this.props;

    const gasEstimateTypeChanged =
      // @ts-expect-error -- legacy JavaScript UI type boundary
      prevProps.gasEstimateType !== this.props.gasEstimateType;

    if (
      // @ts-expect-error -- legacy JavaScript UI type boundary
      (!this.state.stopUpdateGas && !this.state.advancedGasInserted) ||
      gasEstimateTypeChanged
    ) {
      if (
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.gasFeeEstimates &&
        transaction.gas &&
        // @ts-expect-error -- legacy JavaScript UI type boundary
        (!shallowEqual(prevProps.gasFeeEstimates, this.props.gasFeeEstimates) ||
          !transaction.gas.eq(prevProps?.transaction?.gas) ||
          !this.state.ready)
      ) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.computeGasEstimates(null, null, gasEstimateTypeChanged);
      }
    }
  };

  componentWillUnmount = async () => {
    const { approved } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { transaction } = this.props;

    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  handleAppStateChange = (appState) => {
    if (appState !== 'active') {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { transaction } = this.props;
      Engine.rejectPendingApproval(
        transaction?.id,
        providerErrors.userRejectedRequest(),
        {
          ignoreMissing: true,
          logErrors: false,
        },
      );

      // @ts-expect-error -- legacy JavaScript UI type boundary
      this.props.hideModal();
    }
  };

  cancelGasEdition = () => {
    this.setState({
      stopUpdateGas: false,
    });
    this.review();
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  saveGasEditionLegacy = (legacyGasTransaction, legacyGasObject) => {
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  saveGasEdition = (eip1559GasTransaction, eip1559GasObject) => {
    this.setState({ eip1559GasTransaction, eip1559GasObject });
    this.review();
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  validateGas = (total) => {
    let error;
    const {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      ticker,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction: { from },
      // @ts-expect-error -- legacy JavaScript UI type boundary
      accounts,
    } = this.props;

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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { gasEstimateType, showCustomNonce, transaction } = this.props;

    const {
      legacyGasTransaction: gasDataLegacy,
      eip1559GasTransaction: gasDataEIP1559,
    } = this.state;

    return buildTransactionParams({
      gasDataEIP1559,
      gasDataLegacy,
      gasEstimateType,
      showCustomNonce,
      transaction,
    });
  };

  getAnalyticsParams = () => {
    try {
      // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onLedgerConfirmation = (approve, transactionId, gaParams) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transactions,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimateType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      metrics,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      shouldUseSmartTransaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      simulationData: { isUpdatedAfterSecurityCheck } = {},
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      if (this.validateGas(eip1559GasTransaction.totalMaxHex)) return;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
                // @ts-expect-error -- legacy JavaScript UI type boundary
                this.props.hideModal();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: 'ETH',
              });
            } else {
              Logger.error(
                // @ts-expect-error -- legacy JavaScript UI type boundary
                transactionMeta.error,
                'error while trying to finish a transaction (Approve)',
              );
            }
          },
          // @ts-expect-error -- legacy JavaScript UI type boundary
          (transactionMeta) => transactionMeta.id === transaction.id,
        );

      // @ts-expect-error -- legacy JavaScript UI type boundary
      const fullTx = transactions.find(({ id }) => id === transaction.id);

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...fullTx.txParams,
          ...transaction,
          chainId,
        },
      };
      // @ts-expect-error -- legacy JavaScript UI type boundary
      await updateTransaction(updatedTx);
      await KeyringController.resetQRKeyringState();

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            // @ts-expect-error -- legacy JavaScript UI type boundary
            transactionId: transaction.id,
            deviceId,
            onConfirmationComplete: (approve) =>
              this.onLedgerConfirmation(
                approve,
                // @ts-expect-error -- legacy JavaScript UI type boundary
                transaction.id,
                this.getAnalyticsParams(),
              ),
            // @ts-expect-error -- legacy JavaScript UI type boundary
            type: 'signTransaction',
          }),
        );
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.hideModal();
        return;
      }

      // @ts-expect-error -- legacy JavaScript UI type boundary
      await ApprovalController.accept(transaction.id, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
        Logger.error(error, 'error while trying to send transaction (Approve)');
        this.setState({ transactionHandled: true });
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { metrics, hideModal } = this.props;
    Engine.rejectPendingApproval(
      // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onModeChange = (mode) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  setAnalyticsParams = (analyticsParams) => {
    this.setState({ analyticsParams });
  };

  getGasAnalyticsParams = () => {
    try {
      const { analyticsParams } = this.state;
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { gasEstimateType } = this.props;
      return {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        dapp_host_name: analyticsParams?.dapp_host_name,
        active_currency: {
          // @ts-expect-error -- legacy JavaScript UI type boundary
          value: analyticsParams?.active_currency,
          anonymous: true,
        },
        gas_estimate_type: gasEstimateType,
      };
    } catch (error) {
      return {};
    }
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateGasSelected = (selected) => {
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateTransactionState = (gas) => {
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateTokenAllowanceState = (value) => {
    this.setState({ tokenAllowanceState: value });
  };

  render = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const {
      mode,
      ready,
      over,
      gasSelected,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      animateOnChange,
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
      // @ts-expect-error -- legacy JavaScript UI type boundary
      transaction,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      addressBook,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasEstimateType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      gasFeeEstimates,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      primaryCurrency,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      providerType,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      providerRpcTarget,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      networkConfigurations,
    } = this.props;

    const selectedGasObject = {
      suggestedMaxFeePerGas:
        // @ts-expect-error -- legacy JavaScript UI type boundary
        eip1559GasObject.suggestedMaxFeePerGas ||
        gasFeeEstimates[gasSelected]?.suggestedMaxFeePerGas,
      suggestedMaxPriorityFeePerGas:
        // @ts-expect-error -- legacy JavaScript UI type boundary
        eip1559GasObject.suggestedMaxPriorityFeePerGas ||
        gasFeeEstimates[gasSelected]?.suggestedMaxPriorityFeePerGas,
      suggestedGasLimit:
        // @ts-expect-error -- legacy JavaScript UI type boundary
        eip1559GasObject.suggestedGasLimit ||
        // @ts-expect-error -- legacy JavaScript UI type boundary
        eip1559GasTransaction.suggestedGasLimit,
    };

    const selectedLegacyGasObject = {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      legacyGasLimit: legacyGasObject?.legacyGasLimit,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      suggestedGasPrice: legacyGasObject?.suggestedGasPrice,
    };

    const savedContactList = checkIfAddressIsSaved(
      addressBook,
      chainId,
      transaction,
    );

    const savedContactListToArray = Object.values(addressBook).flatMap(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      (value) => Object.values(value),
    );

    let addressNickname = '';

    const filteredSavedContactList = savedContactListToArray.filter(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      (contact) => contact.address === safeToChecksumAddress(address),
    );

    if (filteredSavedContactList.length > 0) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      addressNickname = filteredSavedContactList[0].name;
    }

    if (!transaction.id) return null;
    return (
      <Modal
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
            // @ts-expect-error -- legacy JavaScript UI type boundary
            closeModal={this.toggleModal}
            address={address}
            savedContactListToArray={savedContactListToArray}
            addressNickname={addressNickname}
            providerType={providerType}
            providerChainId={chainId}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={networkConfigurations}
          />
        ) : this.state.isBlockExplorerVisible && !isNonEvmChainId(chainId) ? (
          <ShowBlockExplorer
            setIsBlockExplorerVisible={this.setIsBlockExplorerVisible}
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
                {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
                <ApproveTransactionReview
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  gasError={gasError}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  onCancel={this.onCancel}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  onConfirm={this.onConfirm}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  over={over}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  gasSelected={gasSelected}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  onSetAnalyticsParams={this.setAnalyticsParams}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  gasEstimateType={gasEstimateType}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  onUpdatingValuesStart={this.onUpdatingValuesStart}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  animateOnChange={animateOnChange}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  isAnimating={isAnimating}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  gasEstimationReady={ready}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  savedContactListToArray={savedContactListToArray}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  transactionConfirmed={transactionConfirmed}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  showBlockExplorer={this.setIsBlockExplorerVisible}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  toggleModal={this.toggleModal}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  showVerifyContractDetails={this.showVerifyContractDetails}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  shouldVerifyContractDetails={
                    this.state.shouldVerifyContractDetails
                  }
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  closeVerifyContractDetails={this.closeVerifyContractDetails}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  nicknameExists={savedContactList && !!savedContactList.length}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  nickname={
                    savedContactList && savedContactList.length > 0
                      ? savedContactList[0].nickname
                      : ''
                  }
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  chainId={chainId}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  updateTokenAllowanceState={this.updateTokenAllowanceState}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  tokenAllowanceState={tokenAllowanceState}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  updateTransactionState={this.updateTransactionState}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  legacyGasObject={this.state.legacyGasObject}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  eip1559GasObject={this.state.eip1559GasObject}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
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
                  // @ts-expect-error -- legacy JavaScript UI type boundary
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
                // @ts-expect-error -- legacy JavaScript UI type boundary
                <EditGasFeeLegacy
                  onCancel={this.cancelGasEdition}
                  onSave={this.saveGasEditionLegacy}
                  animateOnChange={animateOnChange}
                  isAnimating={isAnimating}
                  view={'Approve'}
                  analyticsParams={this.getGasAnalyticsParams()}
                  onlyGas
                  selectedGasObject={selectedLegacyGasObject}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => {
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setTransactionObject: (transaction) =>
    dispatch(setTransactionObject(transaction)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setNonce: (nonce) => dispatch(setNonce(nonce)),
  // @ts-expect-error -- legacy JavaScript UI type boundary
  setProposedNonce: (nonce) => dispatch(setProposedNonce(nonce)),
});

Approve.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
// @ts-expect-error -- legacy JavaScript UI type boundary
)(withMetricsAwareness(Approve));

interface ApproveProps {
  accounts?: Record<string, any>;
  addressBook?: Record<string, any>;
  chainId?: string;
  gasEstimateType?: string;
  gasFeeEstimates?: Record<string, any>;
  hideModal?: (...args: any[]) => any;
  metrics?: Record<string, any>;
  modalVisible?: boolean;
  navigation?: Record<string, any>;
  networkClientId?: string;
  networkConfigurations?: Record<string, any>;
  primaryCurrency?: string;
  providerRpcTarget?: string;
  providerType?: string;
  setNonce?: (...args: any[]) => any;
  setProposedNonce?: (...args: any[]) => any;
  setTransactionObject: (...args: any[]) => any;
  shouldUseSmartTransaction?: boolean;
  showCustomNonce?: boolean;
  simulationData?: Record<string, any>;
  ticker?: string;
  transaction: Record<string, any>;
  transactions?: any[];
}
type Props = ApproveProps;
