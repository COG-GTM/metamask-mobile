// Shadowed names and non-optional-chain checks are inherited from the
// original JavaScript implementation and left untouched by this migration.
/* eslint-disable @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain */
// The legacy transaction/gas objects handled by this view are not typed yet.
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType, PureComponent } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  View,
} from 'react-native';
import { getApproveNavbar } from '../../../../../UI/Navbar';
import { connect } from 'react-redux';
import {
  safeToChecksumAddress,
  isHardwareAccount,
} from '../../../../../../util/address';
import Engine from '../../../../../../core/Engine';
import AnimatedTransactionModal from '../../../../../UI/AnimatedTransactionModal';
import ApproveTransactionReviewUntyped from '../../components/ApproveTransactionReview';
import AddNicknameUntyped from '../../components/ApproveTransactionReview/AddNickname';
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
import EditGasFee1559Untyped from '../../components/EditGasFee1559Update';
import EditGasFeeLegacyUntyped from '../../components/EditGasFeeLegacyUpdate';
import AppConstants from '../../../../../../core/AppConstants';
import { shallowEqual } from '../../../../../../util/general';
import { KEYSTONE_TX_CANCELED } from '../../../../../../constants/error';
import GlobalAlert from '../../../../../UI/GlobalAlert';
import checkIfAddressIsSaved from '../../../../../../util/checkAddress';
import { ThemeContext, mockTheme } from '../../../../../../util/theme';
import { Theme } from '../../../../../../util/theme/models';
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

import { Hex } from '@metamask/utils';
import { IWithMetricsAwarenessProps } from '../../../../../../components/hooks/useMetrics/withMetricsAwareness.types';

// These legacy view components are not fully typed yet.
const ApproveTransactionReview =
  ApproveTransactionReviewUntyped as unknown as ComponentType<any>;
const AddNickname = AddNicknameUntyped as unknown as ComponentType<any>;
const EditGasFee1559 = EditGasFee1559Untyped as unknown as ComponentType<any>;
const EditGasFeeLegacy =
  EditGasFeeLegacyUntyped as unknown as ComponentType<any>;

const EDIT = 'edit';
const REVIEW = 'review';

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
interface ApproveProps extends IWithMetricsAwarenessProps {
  /**
   * List of accounts from the AccountTrackerController
   */
  accounts: any;
  /**
   * Transaction state
   */
  transaction: any;
  /**
   * Action that sets transaction attributes from object to a transaction
   */
  setTransactionObject: (transaction: any) => void;
  /**
   * List of transactions
   */
  transactions: any[];
  /**
   * A string representing the network name
   */
  providerType?: string;
  /**
   * Whether the modal is visible
   */
  modalVisible?: boolean;
  /**
   * Hide modal visible or not
   */
  hideModal: () => void;
  /**
   * Current selected ticker
   */
  ticker?: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  gasFeeEstimates: any;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * A string representing the network chainId
   */
  chainId: Hex;
  /**
   * ID of the global network client
   */
  networkClientId: string;
  /**
   * An object of all saved addresses
   */
  addressBook: any;
  networkConfigurations: any;
  providerRpcTarget?: string;
  /**
   * Set transaction nonce
   */
  setNonce: (nonce: number) => void;
  /**
   * Set proposed nonce (from network)
   */
  setProposedNonce: (nonce: number) => void;
  /**
   * Indicates whether custom nonce should be shown in transaction editor
   */
  showCustomNonce?: boolean;
  /**
   * Object that represents the navigator
   */
  navigation: any;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
  /**
   * Object containing simulation data
   */
  simulationData?: { isUpdatedAfterSecurityCheck?: boolean };
}

interface ApproveState {
  approved: boolean;
  gasError?: string;
  ready: boolean;
  mode: string;
  over: boolean;
  analyticsParams: any;
  gasSelected: string;
  gasSelectedTemp: string;
  transactionConfirmed: boolean;
  shouldAddNickname: boolean;
  shouldVerifyContractDetails: boolean;
  suggestedGasLimit?: string;
  eip1559GasObject: any;
  eip1559GasTransaction: any;
  legacyGasObject: any;
  legacyGasTransaction: any;
  isBlockExplorerVisible: boolean;
  address: string;
  tokenAllowanceState?: any;
  isGasEstimateStatusIn: boolean;
  isChangeInSimulationModalOpen: boolean;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  stopUpdateGas?: boolean;
  advancedGasInserted?: boolean;
  transactionHandled?: boolean;
  pollToken?: string;
}

class Approve extends PureComponent<ApproveProps, ApproveState> {

  appStateListener: NativeEventSubscription | undefined;

  #transactionFinishedSubscription: any;

  static navigationOptions = ({ navigation }: { navigation: any }) =>
    (getApproveNavbar as any)('approve.title', navigation);

  state: ApproveState = {
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
    overrideGasLimit?: any,
    gasEstimateTypeChanged?: any,
    // The call site passes a third, historically unused argument.
    _unusedArg?: unknown,
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

  toggleModal = (val?: string) => {
    this.setState({
      shouldAddNickname: !this.state.shouldAddNickname,
      address: val as string,
    });
  };

  startPolling = async () => {
    const pollToken = await startGasPolling(this.state.pollToken);
    this.setState({ pollToken });
  };

  setNetworkNonce = async () => {
    const { networkClientId, setNonce, setProposedNonce, transaction } =
      this.props;
    const proposedNonce = await getNetworkNonce(transaction, networkClientId);
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
    const estimation = await getGasLimit(
      { ...transaction, gas: undefined },
      false,
      networkClientId,
    );
    setTransactionObject({ gas: estimation.gas });
  };

  componentDidUpdate = (prevProps: ApproveProps) => {
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
        this.computeGasEstimates(null, null, gasEstimateTypeChanged);
      }
    }
  };

  componentWillUnmount = async () => {
    const { approved } = this.state;
    const { transaction } = this.props;

    await (stopGasPolling as unknown as (pollToken?: string) => Promise<void>)(
      this.state.pollToken,
    );

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

  handleAppStateChange = (appState: AppStateStatus) => {
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
    legacyGasTransaction: any,
    legacyGasObject: any,
  ) => {
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

  saveGasEdition = (eip1559GasTransaction: any, eip1559GasObject: any) => {
    this.setState({ eip1559GasTransaction, eip1559GasObject });
    this.review();
  };

  validateGas = (total: any) => {
    let error;
    const {
      ticker,
      transaction: { from },
      accounts,
    } = this.props;

    const fromAccount = accounts[safeToChecksumAddress(from) as string];

    const weiBalance = hexToBN(fromAccount.balance);
    const totalTransactionValue = hexToBN(total);
    if (!weiBalance.gte(totalTransactionValue)) {
      const amount = renderFromWei(totalTransactionValue.sub(weiBalance));
      const tokenSymbol = getTicker(ticker as string);
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
      gasEstimateType,
      showCustomNonce,
      transaction,
    } as any);
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
    gaParams: any,
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
      const transaction: any = this.prepareTransaction();
      const isLedgerAccount = isHardwareAccount(transaction.from, [
        ExtendedKeyringTypes.ledger,
      ]);

      this.#transactionFinishedSubscription =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (transactionMeta: any) => {
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
                transactionMeta.error as Error,
                'error while trying to finish a transaction (Approve)',
              );
            }
          },
          (transactionMeta: any) => transactionMeta.id === transaction.id,
        );

      const fullTx: any = transactions.find(
        ({ id }: any) => id === transaction.id,
      );

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...fullTx.txParams,
          ...transaction,
          chainId,
        },
      };
      await (updateTransaction as unknown as (tx: any) => Promise<void>)(
        updatedTx,
      );
      await KeyringController.resetQRKeyringState();

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        this.setState({ transactionHandled: true });
        this.setState({ transactionConfirmed: false });

        this.props.navigation.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: transaction.id,
            deviceId,
            onConfirmationComplete: (approve: boolean) =>
              this.onLedgerConfirmation(
                approve,
                transaction.id,
                this.getAnalyticsParams(),
              ),
            type: 'signTransaction',
          } as any),
        );
        this.props.hideModal();
        return;
      }

      await ApprovalController.accept(transaction.id, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        this.props.hideModal();
      }
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(this.getAnalyticsParams())
          .build(),
      );
    } catch (caughtError) {
      const error = caughtError as Error | undefined;
      if (
        !error?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !error?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          error?.message,
          [{ text: 'OK' }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Approve)',
        );
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

  updateGasSelected = (selected: string) => {
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

  updateTokenAllowanceState = (value: any) => {
    this.setState({ tokenAllowanceState: value });
  };

  render = () => {
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
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
      chainId,
      transaction,
    );

    const savedContactListToArray = Object.values(addressBook).flatMap(
      (value: any) => Object.values(value) as any[],
    );

    let addressNickname = '';

    const filteredSavedContactList = savedContactListToArray.filter(
      (contact: any) => contact.address === safeToChecksumAddress(address),
    );

    if (filteredSavedContactList.length > 0) {
      addressNickname = (filteredSavedContactList[0] as any).name;
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
            type={providerType as string}
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

const mapDispatchToProps = (dispatch: any) => ({
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
  setNonce: (nonce: number) => dispatch(setNonce(nonce)),
  setProposedNonce: (nonce: number) => dispatch(setProposedNonce(nonce)),
});

Approve.contextType = ThemeContext;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Approve as unknown as ComponentType<IWithMetricsAwarenessProps>,
  ),
);
