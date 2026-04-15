









import {
  getShouldStartApprovalRequest,
  getShouldUpdateApprovalRequest,
  getTransactionType } from
'./index';
import Logger from '../Logger';
import {



  SmartTransactionStatuses } from
'@metamask/smart-transactions-controller/dist/types';
import { v1 as random } from 'uuid';
import { decimalToHex } from '../conversions';
import { ApprovalTypes } from '../../core/RPCMethods/RPCMethodMiddleware';
import { RAMPS_SEND } from '../../components/UI/Ramp/constants';

import { addSwapsTransaction } from '../swaps/swaps-transactions';



































const LOG_PREFIX = 'STX publishHook';
// It has to be 21000 for cancel transactions, otherwise the API would reject it.
const CANCEL_GAS = 21000;
export const STX_NO_HASH_ERROR =
'Smart Transaction does not have a transaction hash, there was a problem';

class SmartTransactionHook {
  #approvalEnded;
  #approvalId;
  #chainId;
  #featureFlags;









  #shouldUseSmartTransaction;
  #smartTransactionsController;
  #transactionController;
  #approvalController;
  #transactionMeta;
  #signedTransactionInHex;
  #txParams;
  #controllerMessenger;

  #isDapp;
  #isSend;
  #isInSwapFlow;
  #isSwapApproveTx;
  #isSwapTransaction;
  #isNativeTokenTransferred;

  #shouldStartApprovalRequest;
  #shouldUpdateApprovalRequest;
  #mobileReturnTxHashAsap;
  #transactions;

  constructor(request) {
    const {
      transactionMeta,
      signedTransactionInHex,
      smartTransactionsController,
      controllerMessenger,
      transactionController,
      shouldUseSmartTransaction,
      approvalController,
      featureFlags,
      transactions
    } = request;
    this.#approvalId = undefined;
    this.#approvalEnded = false;
    this.#transactionMeta = transactionMeta;
    this.#signedTransactionInHex = signedTransactionInHex;
    this.#smartTransactionsController = smartTransactionsController;
    this.#transactionController = transactionController;
    this.#approvalController = approvalController;
    this.#shouldUseSmartTransaction = shouldUseSmartTransaction;
    this.#featureFlags = featureFlags;
    this.#chainId = transactionMeta.chainId;
    this.#txParams = transactionMeta.txParams;
    this.#controllerMessenger = controllerMessenger;
    this.#mobileReturnTxHashAsap =
    this.#featureFlags?.smartTransactions?.mobileReturnTxHashAsap ?? false;
    this.#transactions = transactions;

    const {
      isDapp,
      isSend,
      isInSwapFlow,
      isSwapApproveTx,
      isSwapTransaction,
      isNativeTokenTransferred
    } = getTransactionType(this.#transactionMeta, this.#chainId);
    this.#isDapp = isDapp;
    this.#isSend = isSend;
    this.#isInSwapFlow = isInSwapFlow;
    this.#isSwapApproveTx = isSwapApproveTx;
    this.#isSwapTransaction = isSwapTransaction;
    this.#isNativeTokenTransferred = isNativeTokenTransferred;

    const approvalIdForPendingSwapApproveTx =
    this.#getApprovalIdForPendingSwapApproveTx();
    if (approvalIdForPendingSwapApproveTx) {
      this.#approvalId = approvalIdForPendingSwapApproveTx;
    }

    this.#shouldStartApprovalRequest = getShouldStartApprovalRequest(
      this.#isDapp,
      this.#isSend,
      this.#isSwapApproveTx,
      Boolean(approvalIdForPendingSwapApproveTx),
      this.#mobileReturnTxHashAsap
    );
    this.#shouldUpdateApprovalRequest = getShouldUpdateApprovalRequest(
      this.#isDapp,
      this.#isSend,
      this.#isSwapTransaction,
      this.#mobileReturnTxHashAsap
    );
  }

  async submit() {
    // Will cause TransactionController to publish to the RPC provider as normal.
    Logger.log(
      LOG_PREFIX,
      'shouldUseSmartTransaction',
      this.#shouldUseSmartTransaction
    );
    const useRegularTransactionSubmit = { transactionHash: undefined };
    if (
    !this.#shouldUseSmartTransaction ||
    this.#transactionMeta.origin === RAMPS_SEND)
    {
      return useRegularTransactionSubmit;
    }

    Logger.log(
      LOG_PREFIX,
      'Started submit hook',
      this.#transactionMeta.id,
      'transactionMeta.type',
      this.#transactionMeta.type
    );

    try {
      const getFeesResponse = await this.#getFees();
      // In the event that STX health check passes, but for some reason /getFees fails, we fallback to a regular transaction
      if (!getFeesResponse) {
        return useRegularTransactionSubmit;
      }

      const batchStatusPollingInterval =
      this.#featureFlags?.smartTransactions?.batchStatusPollingInterval;
      if (batchStatusPollingInterval) {
        this.#smartTransactionsController.setStatusRefreshInterval(
          batchStatusPollingInterval
        );
      }

      const submitTransactionResponse = await this.#signAndSubmitTransactions({
        getFeesResponse
      });
      const uuid = submitTransactionResponse?.uuid;
      if (!uuid) {
        throw new Error('No smart transaction UUID');
      }

      // We do this so we can show the Swap data (e.g. ETH to USDC, fiat values) in the app/components/Views/TransactionsView/index.js
      if (this.#isSwapTransaction || this.#isSwapApproveTx) {
        this.#updateSwapsTransactions(uuid);
      }

      if (this.#shouldStartApprovalRequest) {
        this.#addApprovalRequest({
          uuid
        });
      }

      if (this.#shouldUpdateApprovalRequest) {
        this.#addListenerToUpdateStatusPage({
          uuid
        });
      }

      const transactionHash = await this.#getTransactionHash(
        submitTransactionResponse,
        uuid
      );

      return { transactionHash };
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error) {
      Logger.error(
        error,
        `${LOG_PREFIX} Error in smart transaction publish hook`
      );
      throw error;
    } finally {
      if (!this.#mobileReturnTxHashAsap) {
        this.#cleanup();
      }
    }
  }

  #validateSubmitBatch = () => {
    if (!this.#shouldUseSmartTransaction) {
      throw new Error(
        `${LOG_PREFIX}: Smart Transaction is required for batch submissions`
      );
    }
    if (!this.#transactions || this.#transactions.length === 0) {
      throw new Error(
        `${LOG_PREFIX}: A list of transactions are required for batch submissions`
      );
    }
  };

  async submitBatch() {
    this.#validateSubmitBatch();
    Logger.log(
      LOG_PREFIX,
      'Started submit batch hook',
      'Transaction IDs:',
      this.#transactions.map((tx) => tx.id).join(', ')
    );

    try {
      const batchStatusPollingInterval =
      this.#featureFlags?.smartTransactions?.batchStatusPollingInterval;
      if (batchStatusPollingInterval) {
        this.#smartTransactionsController.setStatusRefreshInterval(
          batchStatusPollingInterval
        );
      }

      const submitTransactionResponse = await this.#signAndSubmitTransactions();
      const uuid = submitTransactionResponse?.uuid;
      if (!uuid) {
        throw new Error('No smart transaction UUID');
      }

      // We do this so we can show the Swap data (e.g. ETH to USDC, fiat values) in the app/components/Views/TransactionsView/index.js
      if (this.#isSwapTransaction || this.#isSwapApproveTx) {
        this.#updateSwapsTransactions(uuid);
      }

      if (this.#shouldStartApprovalRequest) {
        this.#addApprovalRequest({
          uuid
        });
      }

      if (this.#shouldUpdateApprovalRequest) {
        this.#addListenerToUpdateStatusPage({
          uuid
        });
      }

      const transactionHash = await this.#getTransactionHash(
        submitTransactionResponse,
        uuid
      );
      if (transactionHash === null) {
        throw new Error(
          'Transaction does not have a transaction hash in the publish batch hook, there was a problem'
        );
      }

      let submitBatchResponse;
      if (submitTransactionResponse?.txHashes) {
        submitBatchResponse = {
          results: submitTransactionResponse.txHashes.map((txHash) => ({
            transactionHash: txHash
          }))
        };
      } else {
        submitBatchResponse = {
          results: []
        };
      }

      return submitBatchResponse;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error) {
      Logger.error(
        error,
        `${LOG_PREFIX} Error in smart transaction publish batch hook`
      );
      throw error;
    } finally {
      if (!this.#mobileReturnTxHashAsap) {
        this.#cleanup();
      }
    }
  }

  #getFees = async () => {
    try {
      return await this.#smartTransactionsController.getFees(
        { ...this.#txParams, chainId: this.#chainId },
        undefined
      );
    } catch (error) {
      return undefined;
    }
  };

  #getApprovalIdForPendingSwapApproveTx = () => {
    const pendingApprovalsForSwapApproveTxs = Object.values(
      this.#approvalController.state.pendingApprovals
    ).filter(
      ({ origin: pendingApprovalOrigin, type, requestState }) =>
      // MM_FOX_CODE is the origin for MM Swaps
      pendingApprovalOrigin === process.env.MM_FOX_CODE &&
      type === ApprovalTypes.SMART_TRANSACTION_STATUS &&
      requestState?.isInSwapFlow &&
      requestState?.isSwapApproveTx
    );
    const pendingApprovalsForSwapApproveTx =
    pendingApprovalsForSwapApproveTxs[0];

    return pendingApprovalsForSwapApproveTx && this.#isSwapTransaction ?
    pendingApprovalsForSwapApproveTx.id :
    null;
  };

  #getTransactionHash = async (


  submitTransactionResponse,
  uuid) =>
  {
    let transactionHash;

    if (this.#mobileReturnTxHashAsap && submitTransactionResponse?.txHash) {
      transactionHash = submitTransactionResponse.txHash;
    } else {
      transactionHash = await this.#waitForTransactionHash({
        uuid
      });
    }
    if (transactionHash === null) {
      throw new Error(STX_NO_HASH_ERROR);
    }

    return transactionHash;
  };

  #applyFeeToTransaction = (fee, isCancel) => {
    const unsignedTransactionWithFees = {
      ...this.#txParams,
      maxFeePerGas: `0x${decimalToHex(fee.maxFeePerGas)}`,
      maxPriorityFeePerGas: `0x${decimalToHex(fee.maxPriorityFeePerGas)}`,
      gas: isCancel ?
      `0x${decimalToHex(CANCEL_GAS)}` :
      this.#txParams.gas?.toString(),
      value: this.#txParams.value
    };
    if (isCancel) {
      unsignedTransactionWithFees.to = unsignedTransactionWithFees.from;
      unsignedTransactionWithFees.data = '0x';
    }

    return unsignedTransactionWithFees;
  };

  #createSignedTransactions = async (
  fees,
  isCancel) =>
  {
    const unsignedTransactions = fees.map((fee) =>
    this.#applyFeeToTransaction(fee, isCancel)
    );
    const transactionsWithChainId = unsignedTransactions.map((tx) => ({
      ...tx,
      chainId: tx.chainId || this.#chainId
    }));
    return await this.#transactionController.approveTransactionsWithSameNonce(
      transactionsWithChainId,
      { hasNonce: true }
    );
  };

  #signAndSubmitTransactions = async ({
    getFeesResponse


  } = {}) => {
    let signedTransactions = [];
    if (this.#transactions && Array.isArray(this.#transactions) && this.#transactions.length > 0) {
      // Batch transaction mode - extract signed transactions from this.#transactions[].signedTx
      signedTransactions = this.#transactions.
      filter((tx) => tx?.signedTx).
      map((tx) => tx.signedTx);
    } else if (this.#signedTransactionInHex) {
      // Single transaction mode with pre-signed transaction
      signedTransactions = [this.#signedTransactionInHex];
    } else if (getFeesResponse) {
      signedTransactions = await this.#createSignedTransactions(
        getFeesResponse.tradeTxFees?.fees ?? [],
        false
      );
    }
    return await this.#smartTransactionsController.submitSignedTransactions({
      signedTransactions,
      signedCanceledTransactions: [],
      txParams: this.#txParams,
      transactionMeta: this.#transactionMeta,
      networkClientId: this.#transactionMeta.networkClientId
    });
  };

  #addApprovalRequest = ({ uuid }) => {
    const origin = this.#transactionMeta.origin;

    if (!origin) throw new Error('Origin is required');

    this.#approvalId = random();

    // Do not await on this, since it will not progress any further if so
    this.#approvalController.addAndShowApprovalRequest({
      id: this.#approvalId,
      origin,
      type: ApprovalTypes.SMART_TRANSACTION_STATUS,
      // requestState gets passed to app/components/Views/confirmations/components/Approval/TemplateConfirmation/Templates/SmartTransactionStatus.ts
      // can also be read from approvalController.state.pendingApprovals[approvalId].requestState
      requestState: {
        smartTransaction: {
          status: SmartTransactionStatuses.PENDING,
          creationTime: Date.now(),
          uuid
        },
        isDapp: this.#isDapp,
        isInSwapFlow: this.#isInSwapFlow,
        isSwapApproveTx: this.#isSwapApproveTx,
        isSwapTransaction: this.#isSwapTransaction
      }
    });

    Logger.log(LOG_PREFIX, 'Added approval', this.#approvalId);
  };

  #updateApprovalRequest = async ({
    smartTransaction


  }) => {
    if (this.#approvalId) {
      await this.#approvalController.updateRequestState({
        id: this.#approvalId,
        requestState: {
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          smartTransaction: smartTransaction,
          isDapp: this.#isDapp,
          isInSwapFlow: this.#isInSwapFlow,
          isSwapApproveTx: this.#isSwapApproveTx,
          isSwapTransaction: this.#isSwapTransaction
        }
      });
    }
  };

  #addListenerToUpdateStatusPage = async ({ uuid }) => {
    this.#controllerMessenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      async (smartTransaction) => {
        if (uuid === smartTransaction.uuid) {
          const { status } = smartTransaction;
          if (!status || status === SmartTransactionStatuses.PENDING) {
            return;
          }
          if (this.#shouldUpdateApprovalRequest && !this.#approvalEnded) {
            await this.#updateApprovalRequest({
              smartTransaction
            });
          }
          this.#cleanup();
        }
      }
    );
  };

  #waitForTransactionHash = ({
    uuid


  }) =>
  new Promise((resolve) => {
    this.#controllerMessenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      async (smartTransaction) => {
        if (uuid === smartTransaction.uuid) {
          const { status, statusMetadata } = smartTransaction;
          Logger.log(LOG_PREFIX, 'Smart Transaction: ', smartTransaction);
          if (!status || status === SmartTransactionStatuses.PENDING) {
            return;
          }
          if (statusMetadata?.minedHash) {
            Logger.log(
              LOG_PREFIX,
              'Smart Transaction - Received tx hash: ',
              statusMetadata?.minedHash
            );
            resolve(statusMetadata.minedHash);
          } else {
            // cancelled status will have statusMetadata?.minedHash === ''
            resolve(null);
          }
        }
      }
    );
  });

  #cleanup = () => {
    if (this.#approvalEnded) {
      return;
    }
    this.#approvalEnded = true;
  };

  #updateSwapsTransactions = (uuid) => {
    // We do this so we can show the Swap data (e.g. ETH to USDC, fiat values) in the app/components/Views/TransactionsView/index.js
    const swapsTransactions =
    // @ts-expect-error This is not defined on the type, but is a field added in app/components/UI/Swaps/QuotesView.js
    this.#transactionController.state.swapsTransactions || {};

    const originalSwapsTransaction =
    swapsTransactions[this.#transactionMeta.id];

    addSwapsTransaction(uuid, originalSwapsTransaction);
  };
}

export const submitSmartTransactionHook = (
request) =>
{
  const smartTransactionHook = new SmartTransactionHook(request);
  return smartTransactionHook.submit();
};

export const submitBatchSmartTransactionHook = (
request) =>
{
  const smartTransactionHook = new SmartTransactionHook(request);
  return smartTransactionHook.submitBatch();
};