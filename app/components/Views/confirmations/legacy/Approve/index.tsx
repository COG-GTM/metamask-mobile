import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '../../../../../util/theme';
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
import type { IUseMetricsHook } from '../../../../../components/hooks/useMetrics/useMetrics.types';

const EDIT = 'edit';
const REVIEW = 'review';

interface ApproveProps {
  /**
   * List of accounts from the AccountTrackerController
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: Record<string, any>;
  /**
   * Transaction state
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  /**
   * Action that sets transaction attributes from object to a transaction
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) => void;
  /**
   * List of transactions
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  hideModal?: () => void;
  /**
   * Current selected ticker
   */
  ticker?: string;
  /**
   * Gas fee estimates returned by the gas fee controller
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasFeeEstimates?: any;
  /**
   * Estimate type returned by the gas fee controller, can be market-fee, legacy or eth_gasPrice
   */
  gasEstimateType?: string;
  /**
   * ETH or fiat, depending on user setting
   */
  primaryCurrency?: string;
  /**
   * A string representing the network chainId
   */
  chainId?: string;
  /**
   * ID of the global network client
   */
  networkClientId?: string;
  /**
   * An object of all saved addresses
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addressBook?: Record<string, any>;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkConfigurations?: any;
  providerRpcTarget?: string;
  /**
   * Set transaction nonce
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNonce?: (nonce: any) => void;
  /**
   * Set proposed nonce (from network)
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProposedNonce?: (nonce: any) => void;
  /**
   * Indicates whether custom nonce should be shown in transaction editor
   */
  showCustomNonce?: boolean;
  /**
   * Object that represents the navigator
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
  /**
   * Boolean that indicates if smart transaction should be used
   */
  shouldUseSmartTransaction?: boolean;
  /**
   * Object containing simulation data
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simulationData?: any;
}

/**
 * Functional component that manages ERC20 approve from the dapp browser
 */
const Approve = ({
  accounts,
  transaction,
  setTransactionObject: setTransactionObjectAction,
  transactions,
  providerType,
  modalVisible,
  hideModal,
  ticker,
  gasFeeEstimates,
  gasEstimateType,
  primaryCurrency,
  chainId,
  networkClientId,
  addressBook,
  networkConfigurations,
  providerRpcTarget,
  setNonce: setNonceAction,
  setProposedNonce: setProposedNonceAction,
  showCustomNonce,
  navigation,
  metrics,
  shouldUseSmartTransaction,
  simulationData,
}: ApproveProps) => {
  const { colors } = useTheme();

  const [approved, setApproved] = useState(false);
  const [gasError, setGasError] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState(REVIEW);
  const [over] = useState(false);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyticsParams, setAnalyticsParamsState] = useState<
    Record<string, any>
  >({});
  const [gasSelected, setGasSelected] = useState(
    AppConstants.GAS_OPTIONS.MEDIUM,
  );
  const [gasSelectedTemp, setGasSelectedTemp] = useState(
    AppConstants.GAS_OPTIONS.MEDIUM,
  );
  const [transactionConfirmed, setTransactionConfirmed] = useState(false);
  const [shouldAddNickname, setShouldAddNickname] = useState(false);
  const [shouldVerifyContractDetails, setShouldVerifyContractDetails] =
    useState(false);
  const [suggestedGasLimit, setSuggestedGasLimit] = useState<
    string | undefined
  >(undefined);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eip1559GasObject, setEip1559GasObject] = useState<
    Record<string, any>
  >({});
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eip1559GasTransaction, setEip1559GasTransaction] = useState<
    Record<string, any>
  >({});
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [legacyGasObject, setLegacyGasObject] = useState<
    Record<string, any>
  >({});
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [legacyGasTransaction, setLegacyGasTransaction] = useState<
    Record<string, any>
  >({});
  const [isBlockExplorerVisible, setIsBlockExplorerVisibleState] =
    useState(false);
  const [address, setAddress] = useState('');
  const [tokenAllowanceState, setTokenAllowanceStateValue] = useState<
    string | undefined
  >(undefined);
  const [isGasEstimateStatusIn, setIsGasEstimateStatusIn] = useState(false);
  const [isChangeInSimulationModalOpen, setIsChangeInSimulationModalOpen] =
    useState(false);
  const [stopUpdateGas, setStopUpdateGas] = useState(false);
  const [advancedGasInserted] = useState(false);
  const [animateOnChange, setAnimateOnChange] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const pollTokenRef = useRef<string | undefined>(undefined);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactionFinishedSubscriptionRef = useRef<any>(undefined);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appStateListenerRef = useRef<any>(undefined);
  const approvedRef = useRef(approved);
  approvedRef.current = approved;

  const prevGasFeeEstimatesRef = useRef(gasFeeEstimates);
  const prevGasEstimateTypeRef = useRef(gasEstimateType);
  const prevTransactionGasRef = useRef(transaction?.gas);

  const validateGas = useCallback(
    (total: string) => {
      let error;
      const from = transaction?.from;
      const fromAccount = accounts?.[safeToChecksumAddress(from)];
      const weiBalance = hexToBN(fromAccount?.balance);
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
    },
    [accounts, ticker, transaction?.from],
  );

  const review = useCallback(() => {
    setMode(REVIEW);
  }, []);

  const computeGasEstimates = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (overrideGasLimit: any, gasEstimateTypeChanged: boolean) => {
      const selected = gasEstimateTypeChanged
        ? AppConstants.GAS_OPTIONS.MEDIUM
        : gasSelected;
      const selectedTemp = gasEstimateTypeChanged
        ? AppConstants.GAS_OPTIONS.MEDIUM
        : gasSelectedTemp;

      const limit = fromWei(overrideGasLimit || transaction?.gas, 'wei');

      setReady(true);
      setAnimateOnChange(true);
      setGasSelected(selected);
      setGasSelectedTemp(selectedTemp);
      setSuggestedGasLimit(limit);
      setTimeout(() => setAnimateOnChange(false), 0);
    },
    [gasSelected, gasSelectedTemp, transaction?.gas],
  );

  const handleAppStateChange = useCallback(
    (appState: string) => {
      if (appState !== 'active') {
        Engine.rejectPendingApproval(
          transaction?.id,
          providerErrors.userRejectedRequest(),
          {
            ignoreMissing: true,
            logErrors: false,
          },
        );
        hideModal?.();
      }
    },
    [transaction?.id, hideModal],
  );

  const handleGetGasLimit = useCallback(async () => {
    const estimation = await getGasLimit(
      { ...transaction, gas: undefined },
      false,
      networkClientId,
    );
    setTransactionObjectAction({ gas: estimation.gas });
  }, [transaction, networkClientId, setTransactionObjectAction]);

  const startPolling = useCallback(async () => {
    const newPollToken = await startGasPolling(pollTokenRef.current);
    pollTokenRef.current = newPollToken;
  }, []);

  const setNetworkNonceValue = useCallback(async () => {
    const proposedNonce = await getNetworkNonce(transaction, networkClientId);
    setNonceAction?.(proposedNonce);
    setProposedNonceAction?.(proposedNonce);
  }, [transaction, networkClientId, setNonceAction, setProposedNonceAction]);

  // componentDidMount
  useEffect(() => {
    if (!transaction?.id) {
      hideModal?.();
      return;
    }
    if (!transaction?.gas) {
      handleGetGasLimit();
    }

    startPolling();

    if (showCustomNonce) {
      setNetworkNonceValue();
    }

    appStateListenerRef.current = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate for gas estimates
  useEffect(() => {
    const gasEstimateTypeChanged =
      prevGasEstimateTypeRef.current !== gasEstimateType;

    if ((!stopUpdateGas && !advancedGasInserted) || gasEstimateTypeChanged) {
      if (
        gasFeeEstimates &&
        transaction?.gas &&
        (!shallowEqual(prevGasFeeEstimatesRef.current, gasFeeEstimates) ||
          !transaction.gas.eq(prevTransactionGasRef.current) ||
          !ready)
      ) {
        computeGasEstimates(null, gasEstimateTypeChanged);
      }
    }

    prevGasFeeEstimatesRef.current = gasFeeEstimates;
    prevGasEstimateTypeRef.current = gasEstimateType;
    prevTransactionGasRef.current = transaction?.gas;
  }, [
    gasFeeEstimates,
    gasEstimateType,
    transaction?.gas,
    stopUpdateGas,
    advancedGasInserted,
    ready,
    computeGasEstimates,
  ]);

  // componentWillUnmount
  useEffect(
    () => () => {
      stopGasPolling(pollTokenRef.current);

      const isLedgerAccount = isHardwareAccount(transaction?.from, [
        ExtendedKeyringTypes.ledger,
      ]);

      appStateListenerRef.current?.remove();
      if (!isLedgerAccount) {
        Engine.controllerMessenger.tryUnsubscribe(
          'TransactionController:transactionFinished',
          transactionFinishedSubscriptionRef.current,
        );

        if (!approvedRef.current) {
          Engine.rejectPendingApproval(
            transaction?.id,
            providerErrors.userRejectedRequest(),
            {
              ignoreMissing: true,
              logErrors: false,
            },
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cancelGasEdition = useCallback(() => {
    setStopUpdateGas(false);
    review();
  }, [review]);

  const saveGasEditionLegacy = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gasTransaction: Record<string, any>, gasObject: Record<string, any>) => {
      gasTransaction.error = validateGas(gasTransaction.totalHex);
      setStopUpdateGas(false);
      setLegacyGasTransaction(gasTransaction);
      setLegacyGasObject(gasObject);
      review();
    },
    [validateGas, review],
  );

  const saveGasEdition = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gasTransaction: Record<string, any>, gasObject: Record<string, any>) => {
      setEip1559GasTransaction(gasTransaction);
      setEip1559GasObject(gasObject);
      review();
    },
    [review],
  );

  const prepareTransaction = useCallback(() => {
    return buildTransactionParams({
      gasDataEIP1559: eip1559GasTransaction,
      gasDataLegacy: legacyGasTransaction,
      gasEstimateType,
      showCustomNonce,
      transaction,
    });
  }, [
    eip1559GasTransaction,
    legacyGasTransaction,
    gasEstimateType,
    showCustomNonce,
    transaction,
  ]);

  const getAnalyticsParams = useCallback(() => {
    try {
      return {
        ...analyticsParams,
        gas_estimate_type: gasEstimateType,
        gas_mode: gasSelected ? 'Basic' : 'Advanced',
        speed_set: gasSelected || undefined,
      };
    } catch (error) {
      return {};
    }
  }, [analyticsParams, gasEstimateType, gasSelected]);

  const getGasAnalyticsParams = useCallback(() => {
    try {
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
  }, [analyticsParams, gasEstimateType]);

  const onCancel = useCallback(() => {
    Engine.rejectPendingApproval(
      transaction?.id,
      providerErrors.userRejectedRequest(),
      {
        ignoreMissing: true,
        logErrors: false,
      },
    );
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.APPROVAL_CANCELLED)
        .addProperties(getAnalyticsParams())
        .build(),
    );
    hideModal?.();

    NotificationManager.showSimpleNotification({
      status: `simple_notification_rejected`,
      duration: 5000,
      title: strings('notifications.approved_tx_rejected_title'),
      description: strings('notifications.wc_description'),
    });
  }, [transaction?.id, metrics, getAnalyticsParams, hideModal]);

  const onLedgerConfirmation = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (approve: boolean, _transactionId: string, gaParams: Record<string, any>) => {
      try {
        //manual cancel from UI when transaction is awaiting from ledger confirmation
        if (!approve) {
          //cancelTransaction will change transaction status to reject and throw error from event listener
          //component is being unmounted, error will be unhandled, hence remove listener before cancel
          Engine.controllerMessenger.tryUnsubscribe(
            'TransactionController:transactionFinished',
            transactionFinishedSubscriptionRef.current,
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
    },
    [metrics],
  );

  const onConfirm = useCallback(async () => {
    const { KeyringController, ApprovalController } = Engine.context;
    const { isUpdatedAfterSecurityCheck } = simulationData || {};

    if (isUpdatedAfterSecurityCheck) {
      setIsChangeInSimulationModalOpen(true);

      navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.CHANGE_IN_SIMULATION_MODAL,
        params: {
          onProceed: () => {
            setIsChangeInSimulationModalOpen(false);
            setTransactionConfirmed(false);
          },
          onReject: () => {
            setIsChangeInSimulationModalOpen(false);
            onCancel();
          },
        },
      });
      return;
    }

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      if (validateGas(eip1559GasTransaction.totalMaxHex)) return;
    } else if (validateGas(legacyGasTransaction.totalHex)) return;
    if (transactionConfirmed) return;

    setTransactionConfirmed(true);

    try {
      const preparedTransaction = prepareTransaction();
      const isLedgerAccount = isHardwareAccount(preparedTransaction.from, [
        ExtendedKeyringTypes.ledger,
      ]);

      transactionFinishedSubscriptionRef.current =
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (transactionMeta: any) => {
            if (transactionMeta.status === 'submitted') {
              if (!isLedgerAccount) {
                setApproved(true);
                hideModal?.();
              }
              NotificationManager.watchSubmittedTransaction({
                ...transactionMeta,
                assetType: 'ETH',
              });
            } else {
              Logger.error(
                transactionMeta.error,
                'error while trying to finish a transaction (Approve)',
              );
            }
          },
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (transactionMeta: any) =>
            transactionMeta.id === preparedTransaction.id,
        );

      const fullTx = transactions.find(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ id }: any) => id === preparedTransaction.id,
      );

      const updatedTx = {
        ...fullTx,
        txParams: {
          ...fullTx.txParams,
          ...preparedTransaction,
          chainId,
        },
      };
      await updateTransaction(updatedTx);
      await KeyringController.resetQRKeyringState();

      // For Ledger Accounts we handover the signing to the confirmation flow
      if (isLedgerAccount) {
        const deviceId = await getDeviceId();
        setTransactionConfirmed(false);

        navigation?.navigate(
          ...createLedgerTransactionModalNavDetails({
            transactionId: preparedTransaction.id,
            deviceId,
            onConfirmationComplete: (ledgerApprove: boolean) =>
              onLedgerConfirmation(
                ledgerApprove,
                preparedTransaction.id,
                getAnalyticsParams(),
              ),
            type: 'signTransaction',
          }),
        );
        hideModal?.();
        return;
      }

      await ApprovalController.accept(preparedTransaction.id, undefined, {
        waitForResult: !shouldUseSmartTransaction,
      });
      if (shouldUseSmartTransaction) {
        hideModal?.();
      }
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.APPROVAL_COMPLETED)
          .addProperties(getAnalyticsParams())
          .build(),
      );
    } catch (error) {
      if (
        !(error as Error)?.message?.startsWith(KEYSTONE_TX_CANCELED) &&
        !(error as Error)?.message?.startsWith(STX_NO_HASH_ERROR)
      ) {
        Alert.alert(
          strings('transactions.transaction_error'),
          error && (error as Error).message,
          [{ text: 'OK' }],
        );
        Logger.error(
          error as Error,
          'error while trying to send transaction (Approve)',
        );
        hideModal?.();
      } else {
        metrics.trackEvent(
          metrics
            .createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            )
            .build(),
        );
      }
    }
    setTransactionConfirmed(true);
  }, [
    simulationData,
    navigation,
    gasEstimateType,
    eip1559GasTransaction,
    legacyGasTransaction,
    transactionConfirmed,
    prepareTransaction,
    transactions,
    chainId,
    shouldUseSmartTransaction,
    metrics,
    getAnalyticsParams,
    validateGas,
    onCancel,
    onLedgerConfirmation,
    hideModal,
  ]);

  const onModeChange = useCallback(
    (newMode: string) => {
      setMode(newMode);
      if (newMode === EDIT) {
        metrics.trackEvent(
          metrics
            .createEventBuilder(
              MetaMetricsEvents.SEND_FLOW_ADJUSTS_TRANSACTION_FEE,
            )
            .build(),
        );
      }
    },
    [metrics],
  );

  const showVerifyContractDetails = useCallback(() => {
    setShouldVerifyContractDetails(true);
  }, []);

  const closeVerifyContractDetails = useCallback(() => {
    setShouldVerifyContractDetails(false);
  }, []);

  const toggleModal = useCallback(
    (val: string) => {
      setShouldAddNickname(!shouldAddNickname);
      setAddress(val);
    },
    [shouldAddNickname],
  );

  const updateGasSelected = useCallback((selected: string) => {
    setStopUpdateGas(!selected);
    setGasSelectedTemp(selected);
    setGasSelected(selected);
  }, []);

  const onUpdatingValuesStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const onUpdatingValuesEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const updateTransactionState = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gas: Record<string, any>) => {
      const error = validateGas(gas.totalMaxHex || gas.totalHex);
      setEip1559GasTransaction(gas);
      setLegacyGasTransaction(gas);
      setIsGasEstimateStatusIn(true);
      setGasError(error);
    },
    [validateGas],
  );

  const setIsBlockExplorerVisible = useCallback(() => {
    setIsBlockExplorerVisibleState((prev) => !prev);
  }, []);

  const updateTokenAllowanceState = useCallback((value: string) => {
    setTokenAllowanceStateValue(value);
  }, []);

  const setAnalyticsParamsCallback = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: Record<string, any>) => {
      setAnalyticsParamsState(params);
    },
    [],
  );

  const styles = createStyles(colors);

  const selectedGasObject = {
    suggestedMaxFeePerGas:
      eip1559GasObject.suggestedMaxFeePerGas ||
      gasFeeEstimates?.[gasSelected]?.suggestedMaxFeePerGas,
    suggestedMaxPriorityFeePerGas:
      eip1559GasObject.suggestedMaxPriorityFeePerGas ||
      gasFeeEstimates?.[gasSelected]?.suggestedMaxPriorityFeePerGas,
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

  const savedContactListToArray = Object.values(addressBook || {}).flatMap(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => Object.values(value),
  );

  let addressNickname = '';

  const filteredSavedContactList = savedContactListToArray.filter(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (contact: any) => contact.address === safeToChecksumAddress(address),
  );

  if (filteredSavedContactList.length > 0) {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addressNickname = (filteredSavedContactList[0] as any).name;
  }

  if (!transaction?.id) return null;
  return (
    <Modal
      isVisible={modalVisible && !isChangeInSimulationModalOpen}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={shouldAddNickname ? styles.updateNickView : styles.bottomModal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      animationInTiming={600}
      animationOutTiming={600}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      onSwipeComplete={onCancel}
      swipeDirection={'down'}
      propagateSwipe
    >
      {shouldAddNickname ? (
        <AddNickname
          closeModal={toggleModal}
          address={address}
          savedContactListToArray={savedContactListToArray}
          addressNickname={addressNickname}
          providerType={providerType}
          providerChainId={chainId}
          providerRpcTarget={providerRpcTarget}
          networkConfigurations={networkConfigurations}
        />
      ) : isBlockExplorerVisible && !isNonEvmChainId(chainId) ? (
        <ShowBlockExplorer
          setIsBlockExplorerVisible={setIsBlockExplorerVisible}
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
              onModeChange={onModeChange}
              ready={ready}
              review={review}
            >
              <ApproveTransactionReview
                gasError={gasError}
                onCancel={onCancel}
                onConfirm={onConfirm}
                over={over}
                gasSelected={gasSelected}
                onSetAnalyticsParams={setAnalyticsParamsCallback}
                gasEstimateType={gasEstimateType}
                onUpdatingValuesStart={onUpdatingValuesStart}
                onUpdatingValuesEnd={onUpdatingValuesEnd}
                animateOnChange={animateOnChange}
                isAnimating={isAnimating}
                gasEstimationReady={ready}
                savedContactListToArray={savedContactListToArray}
                transactionConfirmed={transactionConfirmed}
                showBlockExplorer={setIsBlockExplorerVisible}
                toggleModal={toggleModal}
                showVerifyContractDetails={showVerifyContractDetails}
                shouldVerifyContractDetails={shouldVerifyContractDetails}
                closeVerifyContractDetails={closeVerifyContractDetails}
                nicknameExists={savedContactList && !!savedContactList.length}
                nickname={
                  savedContactList && savedContactList.length > 0
                    ? savedContactList[0].nickname
                    : ''
                }
                chainId={chainId}
                updateTokenAllowanceState={updateTokenAllowanceState}
                tokenAllowanceState={tokenAllowanceState}
                updateTransactionState={updateTransactionState}
                legacyGasObject={legacyGasObject}
                eip1559GasObject={eip1559GasObject}
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
                initialSuggestedGasLimit={suggestedGasLimit}
                gasOptions={gasFeeEstimates}
                onChange={updateGasSelected}
                primaryCurrency={primaryCurrency}
                chainId={chainId}
                onCancel={cancelGasEdition}
                onSave={saveGasEdition}
                animateOnChange={animateOnChange}
                isAnimating={isAnimating}
                view={'Approve'}
                analyticsParams={getGasAnalyticsParams()}
                onlyGas
                selectedGasObject={selectedGasObject}
              />
            ) : (
              <EditGasFeeLegacy
                onCancel={cancelGasEdition}
                onSave={saveGasEditionLegacy}
                animateOnChange={animateOnChange}
                isAnimating={isAnimating}
                view={'Approve'}
                analyticsParams={getGasAnalyticsParams()}
                onlyGas
                selectedGasObject={selectedLegacyGasObject}
                error={legacyGasTransaction.error}
                onUpdatingValuesStart={onUpdatingValuesStart}
                onUpdatingValuesEnd={onUpdatingValuesEnd}
                chainId={chainId}
              />
            ))}
        </KeyboardAwareScrollView>
      )}
      <GlobalAlert />
    </Modal>
  );
};

// Static navigation options
Approve.navigationOptions = ({
  navigation,
}: {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}) => getApproveNavbar('approve.title', navigation);

// TODO: Replace "any" with type
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTransactionObject: (transaction: any) =>
    dispatch(setTransactionObject(transaction)),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNonce: (nonce: any) => dispatch(setNonce(nonce)),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProposedNonce: (nonce: any) => dispatch(setProposedNonce(nonce)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(Approve));
