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
  setTransactionObject as setTransactionObjectAction,
  setNonce as setNonceAction,
  setProposedNonce as setProposedNonceAction,
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
import { Theme } from '../../../../../../util/theme/models';
import { RootState } from '../../../../../../reducers';
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
import { IUseMetricsHook } from '../../../../../../components/hooks/useMetrics/useMetrics.types';
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

interface ApproveTransaction {
  id?: string;
  from?: string;
  to?: string;
  data?: string;
  value?: string;
  gas?: string;
  origin?: string;
  chainId?: string;
  networkID?: string;
  assetType?: string;
  [key: string]: unknown;
}

interface ApproveNavigation {
  navigate: (...args: unknown[]) => void;
  setOptions: (options: Record<string, unknown>) => void;
  pop: (...args: unknown[]) => void;
  push: (...args: unknown[]) => void;
  goBack: () => void;
  dangerouslyGetParent?: () => unknown;
  [key: string]: unknown;
}

interface ApproveProps {
  accounts?: Record<string, { balance?: string; [key: string]: unknown }>;
  transaction: ApproveTransaction;
  setTransactionObject: (transaction: Record<string, unknown>) => void;
  transactions?: unknown[];
  providerType?: string;
  modalVisible?: boolean;
  hideModal?: () => void;
  ticker?: string;
  gasFeeEstimates?: Record<string, unknown>;
  gasEstimateType?: string;
  primaryCurrency?: string;
  chainId?: string;
  networkClientId?: string;
  addressBook?: Record<string, unknown>;
  networkConfigurations?: Record<string, unknown>;
  providerRpcTarget?: string;
  setNonce?: (nonce: unknown) => void;
  setProposedNonce?: (nonce: unknown) => void;
  showCustomNonce?: boolean;
  navigation: ApproveNavigation;
  metrics: IUseMetricsHook;
  shouldUseSmartTransaction?: boolean;
  simulationData?: Record<string, unknown>;
  conversionRate?: number;
  currentCurrency?: string;
  tokensLength?: number;
  accountsLength?: number;
}

interface ApproveState {
  approved: boolean;
  gasError?: string;
  ready: boolean;
  mode: string;
  over: boolean;
  analyticsParams: Record<string, unknown>;
  gasSelected: string;
  gasSelectedTemp: string;
  transactionConfirmed: boolean;
  shouldAddNickname: boolean;
  shouldVerifyContractDetails: boolean;
  suggestedGasLimit?: string;
  eip1559GasObject: Record<string, unknown>;
  eip1559GasTransaction: Record<string, unknown>;
  legacyGasObject: Record<string, unknown>;
  legacyGasTransaction: Record<string, unknown>;
  isBlockExplorerVisible: boolean;
  address: string;
  tokenAllowanceState?: unknown;
  isGasEstimateStatusIn: boolean;
  isChangeInSimulationModalOpen: boolean;
  pollToken?: string;
  advancedGasInserted?: boolean;
  stopUpdateGas?: boolean;
  animateOnChange?: boolean;
  isAnimating?: boolean;
  transactionHandled?: boolean;
}

/**
 * PureComponent that manages ERC20 approve from the dapp browser
 */
class Approve extends PureComponent<ApproveProps, ApproveState> {
  static contextType = ThemeContext;


  appStateListener?: { remove: () => void };

  #transactionFinishedSubscription?: unknown;

  static navigationOptions = () => getApproveNavbar('approve.title');

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
    overrideGasLimit?: string | null,
    gasEstimateTypeChanged?: boolean | null,
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
    const proposedNonce = await getNetworkNonce(
      transaction as { from: string },
      networkClientId as string,
    );
    setNonce?.(proposedNonce);
    setProposedNonce?.(proposedNonce);
  };

  componentDidMount = async () => {
    const { showCustomNonce } = this.props;
    if (!this.props?.transaction?.id) {
      this.props.hideModal?.();
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
          !(
            transaction.gas as unknown as { eq: (v: unknown) => boolean }
          ).eq(prevProps?.transaction?.gas) ||
          !this.state.ready)
      ) {
        this.computeGasEstimates(null, null);
      }
    }
  };

  componentWillUnmount = async () => {
    const { approved } = this.state;
    const { transaction } = this.props;

    await (stopGasPolling as (token?: string) => Promise<void>)(
      this.state.pollToken,
    );

    const isLedgerAccount = isHardwareAccount(transaction.from as string, [
      ExtendedKeyringTypes.ledger,
    ]);

    this.appStateListener?.remove();
    if (!isLedgerAccount) {
      Engine.controllerMessenger.tryUnsubscribe(
        'TransactionController:transactionFinished',
        this.#transactionFinishedSubscription as never,
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

  handleAppStateChange = (appState: string) => {
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

      this.props.hideModal?.();
    }
  };

  cancelGasEdition = () => {
    this.setState({
      stopUpdateGas: false,
    });
    this.review();
  };

  saveGasEditionLegacy = (
    legacyGasTransaction: Record<string, unknown>,
    legacyGasObject: Record<string, unknown>,
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
    eip1559GasTransaction: Record<string, unknown>,
    eip1559GasObject: Record<string, unknown>,
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

    const fromAccount =
      accounts?.[safeToChecksumAddress(from as string) as string];

    const weiBalance = hexToBN(fromAccount?.balance as string);
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
      gasEstimateType,
      showCustomNonce,
      transaction,
    } as unknown as Parameters<typeof buildTransactionParams>[0]);
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
    _transactionId?: string,
    gaParams?: Record<string, unknown>,
  ) => {
    const { metrics } = this.props;

    try {
      //manual cancel from UI when transaction is awaiting from ledger confirmation
      if (!approve) {
        //cancelTransaction will change transaction status to reject and throw error from event listener
        //component is being unmounted, error will be unhandled, hence remove listener before cancel
        Engine.controllerMessenger.tryUnsubscribe(
          'TransactionController:transactionFinished',
          this.#transactionFinishedSubscription as never,
        );

        metrics.trackEvent(
          metrics
            .createEventBuilder(MetaMetricsEvents.APPROVAL_CANCELLED)
            .addProperties(gaParams as never)
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
          .addProperties(gaParams as never)
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
      if (this.validateGas(eip1559GasTransaction.totalMaxHex as string))
        return;
    } else if (this.validateGas(legacyGasTransaction.totalHex as string))
      return;
    if (transactionConfirmed) return;

    this.setState({ transactionConfirmed: true });

    try {
      const transaction = this.prepareTransaction() as ReturnType<
        typeof buildTransactionParams
      > & { id?: string; from?: string };
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
                this.props.hideModal?.();
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
          (transactionMeta) => transactionMeta.id === transaction.id,
        );

      const fullTx = transactions?.find(
        (tx) => (tx as { id?: string }).id === transaction.id,
      ) as { txParams?: Record<string, unknown> } | undefined;

      const updatedTx = {
        ...(fullTx ?? {}),
        txParams: {
          ...(fullTx?.txParams ?? {}),
          ...transaction,
          chainId,
        },
      };
      await (updateTransaction as (transactionMeta: unknown) => Promise<void>)(
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
          } as unknown as Parameters<
            typeof createLedgerTransactionModalNavDetails
          >[0]),
        );
        this.props.hideModal?.();
        return;
      }

      await ApprovalController.accept(transaction.id as string, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        this.props.hideModal?.();
      }
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(this.getAnalyticsParams())
          .build(),
      );
    } catch (error) {
      const err = error as Error;
      if (
        !err?.message.startsWith(KEYSTONE_TX_CANCELED) &&
        !err?.message.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          err?.message,
          [{ text: 'OK' }],
        );
        Logger.error(err, 'error while trying to send transaction (Approve)');
        this.setState({ transactionHandled: true });
        this.props.hideModal?.();
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
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
    hideModal?.();

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

  updateTransactionState = (gas: Record<string, unknown>) => {
    const gasError = this.validateGas(
      (gas.totalMaxHex || gas.totalHex) as string,
    );

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

  updateTokenAllowanceState = (value: unknown) => {
    this.setState({ tokenAllowanceState: value });
  };

  render = () => {
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    const AddNicknameComponent =
      AddNickname as unknown as React.ComponentType<Record<string, unknown>>;
    const EditGasFee1559Component =
      EditGasFee1559 as unknown as React.ComponentType<Record<string, unknown>>;
    const EditGasFeeLegacyComponent =
      EditGasFeeLegacy as unknown as React.ComponentType<
        Record<string, unknown>
      >;

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

    const gasFeeEstimatesTyped = (gasFeeEstimates ?? {}) as Record<
      string,
      {
        suggestedMaxFeePerGas?: string;
        suggestedMaxPriorityFeePerGas?: string;
      }
    >;
    const eip1559GasObjectTyped = eip1559GasObject as {
      suggestedMaxFeePerGas?: string;
      suggestedMaxPriorityFeePerGas?: string;
      suggestedGasLimit?: string;
    };
    const eip1559GasTransactionTyped = eip1559GasTransaction as {
      suggestedGasLimit?: string;
    };
    const legacyGasObjectTyped = legacyGasObject as {
      legacyGasLimit?: string;
      suggestedGasPrice?: string;
    };

    const selectedGasObject = {
      suggestedMaxFeePerGas:
        eip1559GasObjectTyped.suggestedMaxFeePerGas ||
        gasFeeEstimatesTyped[gasSelected]?.suggestedMaxFeePerGas,
      suggestedMaxPriorityFeePerGas:
        eip1559GasObjectTyped.suggestedMaxPriorityFeePerGas ||
        gasFeeEstimatesTyped[gasSelected]?.suggestedMaxPriorityFeePerGas,
      suggestedGasLimit:
        eip1559GasObjectTyped.suggestedGasLimit ||
        eip1559GasTransactionTyped.suggestedGasLimit,
    };

    const selectedLegacyGasObject = {
      legacyGasLimit: legacyGasObjectTyped?.legacyGasLimit,
      suggestedGasPrice: legacyGasObjectTyped?.suggestedGasPrice,
    };

    const savedContactList = checkIfAddressIsSaved(
      addressBook as Parameters<typeof checkIfAddressIsSaved>[0],
      chainId as string,
      transaction as Parameters<typeof checkIfAddressIsSaved>[2],
    );

    const savedContactListToArray = Object.values(addressBook ?? {}).flatMap(
      (value) => Object.values(value as Record<string, unknown>),
    );

    let addressNickname = '';

    const filteredSavedContactList = savedContactListToArray.filter(
      (contact) =>
        (contact as { address?: string }).address ===
        safeToChecksumAddress(address),
    );

    if (filteredSavedContactList.length > 0) {
      addressNickname = (filteredSavedContactList[0] as { name?: string })
        .name as string;
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
          <AddNicknameComponent
            closeModal={this.toggleModal as () => void}
            address={address}
            savedContactListToArray={savedContactListToArray}
            addressNickname={addressNickname}
            providerType={providerType as string}
            providerChainId={chainId as `0x${string}`}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={
              networkConfigurations as React.ComponentProps<
                typeof AddNickname
              >['networkConfigurations']
            }
          />
        ) : this.state.isBlockExplorerVisible &&
          !isNonEvmChainId(chainId as string) ? (
          <ShowBlockExplorer
            setIsBlockExplorerVisible={this.setIsBlockExplorerVisible}
            type={providerType as string}
            address={transaction.to as string}
            headerWrapperStyle={styles.headerWrapper}
            headerTextStyle={styles.headerText}
            iconStyle={styles.icon}
            providerRpcTarget={providerRpcTarget}
            networkConfigurations={
              networkConfigurations as React.ComponentProps<
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
                  gasOptions={
                    gasFeeEstimates as unknown as React.ComponentProps<
                      typeof EditGasFee1559
                    >['gasOptions']
                  }
                  onChange={this.updateGasSelected}
                  primaryCurrency={primaryCurrency as string}
                  chainId={chainId as string}
                  onCancel={this.cancelGasEdition}
                  onSave={this.saveGasEdition}
                  animateOnChange={animateOnChange}
                  isAnimating={isAnimating as boolean}
                  view={'Approve'}
                  analyticsParams={
                    this.getGasAnalyticsParams() as unknown as React.ComponentProps<
                      typeof EditGasFee1559
                    >['analyticsParams']
                  }
                  onlyGas
                  selectedGasObject={
                    selectedGasObject as React.ComponentProps<
                      typeof EditGasFee1559
                    >['selectedGasObject']
                  }
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
                  selectedGasObject={
                    selectedLegacyGasObject as React.ComponentProps<
                      typeof EditGasFeeLegacy
                    >['selectedGasObject']
                  }
                  error={
                    legacyGasTransaction.error as React.ComponentProps<
                      typeof EditGasFeeLegacy
                    >['error']
                  }
                  onUpdatingValuesStart={this.onUpdatingValuesStart}
                  onUpdatingValuesEnd={this.onUpdatingValuesEnd}
                  chainId={chainId as string}
                />
              ))}
          </KeyboardAwareScrollView>
        )}
        <GlobalAlert />
      </Modal>
    );
  };
}

const mapStateToProps = (state: RootState) => {
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObjectAction(transaction)),
  setNonce: (nonce: unknown) => dispatch(setNonceAction(nonce)),
  setProposedNonce: (nonce: unknown) => dispatch(setProposedNonceAction(nonce)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    Approve as unknown as Parameters<typeof withMetricsAwareness>[0],
  ),
);
