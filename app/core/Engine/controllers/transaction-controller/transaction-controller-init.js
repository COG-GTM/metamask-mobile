import {
  TransactionController } from






'@metamask/transaction-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import { hasProperty } from '@metamask/utils';





import { REDESIGNED_TRANSACTION_TYPES } from '../../../../components/Views/confirmations/constants/confirmations';
import { selectSwapsChainFeatureFlags } from '../../../../reducers/swaps';
import { selectShouldUseSmartTransaction } from '../../../../selectors/smartTransactionsController';
import Logger from '../../../../util/Logger';
import { getGlobalChainId as getGlobalChainIdSelector } from '../../../../util/networks/global-network';
import {
  submitSmartTransactionHook,
  submitBatchSmartTransactionHook } from

'../../../../util/smart-transactions/smart-publish-hook';
import { getTransactionById } from '../../../../util/transactions';







import {
  handleTransactionApprovedEventForMetrics,
  handleTransactionRejectedEventForMetrics,
  handleTransactionSubmittedEventForMetrics,
  handleTransactionAddedEventForMetrics,
  handleTransactionFinalizedEventForMetrics } from
'./event-handlers/metrics';
import { handleShowNotification } from './event-handlers/notification';

export const TransactionControllerInit =



(request) => {
  const {
    controllerMessenger,
    getState,
    getGlobalChainId,
    initMessenger,
    persistedState
  } = request;

  const {
    approvalController,
    gasFeeController,
    keyringController,
    networkController,
    preferencesController,
    smartTransactionsController
  } = getControllers(request);

  try {
    const transactionController =
    new TransactionController({
      isAutomaticGasFeeUpdateEnabled: ({ type }) =>
      REDESIGNED_TRANSACTION_TYPES.includes(type),
      disableHistory: true,
      disableSendFlowHistory: true,
      disableSwaps: true,
      getCurrentNetworkEIP1559Compatibility: (...args) =>
      // @ts-expect-error Controller type does not support undefined return value
      networkController.getEIP1559Compatibility(...args),
      // @ts-expect-error - TransactionController expects TransactionMeta[] but SmartTransactionsController returns SmartTransaction[]
      getExternalPendingTransactions: (address) =>
      smartTransactionsController.getTransactions({
        addressFrom: address,
        status: SmartTransactionStatuses.PENDING
      }),
      getGasFeeEstimates: (...args) =>
      gasFeeController.fetchGasFeeEstimates(...args),
      getNetworkClientRegistry: (...args) =>
      networkController.getNetworkClientRegistry(...args),
      getNetworkState: () => networkController.state,
      hooks: {
        // @ts-expect-error - TransactionController actually sends a signedTx as a second argument, but its type doesn't reflect that.
        publish: (transactionMeta, signedTransactionInHex) =>
        publishHook({
          transactionMeta,
          getState,
          transactionController,
          smartTransactionsController,
          approvalController,
          initMessenger,
          signedTransactionInHex
        }),
        publishBatch: async (_request) =>
        await publishBatchSmartTransactionHook({
          transactionController,
          smartTransactionsController,
          initMessenger,
          getState,
          approvalController,
          transactions:
          _request.transactions
        })
      },
      incomingTransactions: {
        isEnabled: () =>
        isIncomingTransactionsEnabled(
          preferencesController,
          networkController,
          getGlobalChainId
        ),
        updateTransactions: true
      },
      isSimulationEnabled: () =>
      preferencesController.state.useTransactionSimulations,
      messenger: controllerMessenger,
      pendingTransactions: {
        isResubmitEnabled: () => false
      },
      // @ts-expect-error - TransactionMeta mismatch type with TypedTransaction from '@ethereumjs/tx'
      sign: (...args) => keyringController.signTransaction(...args),
      state: persistedState.TransactionController,
      publicKeyEIP7702: process.env.EIP_7702_PUBLIC_KEY
    });

    addTransactionControllerListeners({
      initMessenger,
      getState,
      smartTransactionsController
    });

    return { controller: transactionController };
  } catch (error) {
    Logger.error(error, 'Failed to initialize TransactionController');
    throw error;
  }
};

function publishHook({
  transactionMeta,
  getState,
  transactionController,
  smartTransactionsController,
  approvalController,
  initMessenger,
  signedTransactionInHex








}) {
  const state = getState();
  const { shouldUseSmartTransaction, featureFlags } =
  getSmartTransactionCommonParams(state, transactionMeta.chainId);

  // @ts-expect-error - TransactionController expects transactionHash to be defined but submitSmartTransactionHook could return undefined
  return submitSmartTransactionHook({
    transactionMeta,
    transactionController,
    smartTransactionsController,
    shouldUseSmartTransaction,
    approvalController,
    controllerMessenger:
    initMessenger,
    featureFlags,
    signedTransactionInHex
  });
}

function getSmartTransactionCommonParams(state, chainId) {
  const shouldUseSmartTransaction = selectShouldUseSmartTransaction(state, chainId);
  const featureFlags = selectSwapsChainFeatureFlags(state, chainId);

  return {
    shouldUseSmartTransaction,
    featureFlags
  };
}

function publishBatchSmartTransactionHook({
  transactionController,
  smartTransactionsController,
  initMessenger,
  getState,
  approvalController,
  transactions







}) {
  // Get transactionMeta based on the last transaction ID
  const lastTransaction = transactions[transactions.length - 1];
  const transactionMeta = getTransactionById(
    lastTransaction.id ?? '',
    transactionController
  );
  const state = getState();

  if (!transactionMeta) {
    throw new Error(
      `publishBatchSmartTransactionHook: Could not find transaction with id ${lastTransaction.id}`
    );
  }

  const { shouldUseSmartTransaction, featureFlags } =
  getSmartTransactionCommonParams(state, transactionMeta.chainId);

  if (!shouldUseSmartTransaction) {
    throw new Error(
      'publishBatchSmartTransactionHook: Smart Transaction is required for batch submissions'
    );
  }

  return submitBatchSmartTransactionHook({
    transactions,
    transactionController,
    smartTransactionsController,
    controllerMessenger:
    initMessenger,
    shouldUseSmartTransaction,
    approvalController,
    featureFlags,
    transactionMeta
  });
}

function isIncomingTransactionsEnabled(
preferencesController,
networkController,
getGlobalChainId)
{
  const currentHexChainId = getGlobalChainIdSelector(networkController);
  const showIncomingTransactions =
  preferencesController.state?.showIncomingTransactions;
  const currentChainId = getGlobalChainId();
  return Boolean(
    hasProperty(showIncomingTransactions, currentChainId) &&
    showIncomingTransactions?.[
    currentHexChainId]

  );
}

function getControllers(
request)



{
  return {
    approvalController: request.getController('ApprovalController'),
    gasFeeController: request.getController('GasFeeController'),
    keyringController: request.getController('KeyringController'),
    networkController: request.getController('NetworkController'),
    preferencesController: request.getController('PreferencesController'),
    smartTransactionsController: request.getController(
      'SmartTransactionsController'
    )
  };
}

function addTransactionControllerListeners(
transactionEventHandlerRequest)
{
  const { initMessenger } = transactionEventHandlerRequest;

  initMessenger.subscribe(
    'TransactionController:transactionApproved',
    ({ transactionMeta }) => {
      handleShowNotification(transactionMeta);
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionApproved',
    ({ transactionMeta }) => {
      handleTransactionApprovedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    (transactionMeta) => {
      handleTransactionFinalizedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionDropped',
    ({ transactionMeta }) => {
      handleTransactionFinalizedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionFailed',
    ({ transactionMeta }) => {
      handleTransactionFinalizedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionRejected',
    ({ transactionMeta }) => {
      handleTransactionRejectedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:transactionSubmitted',
    ({ transactionMeta }) => {
      handleTransactionSubmittedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );

  initMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    (transactionMeta) => {
      handleTransactionAddedEventForMetrics(
        transactionMeta,
        transactionEventHandlerRequest
      );
    }
  );
}