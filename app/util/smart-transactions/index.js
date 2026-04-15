

import TransactionTypes from '../../core/TransactionTypes';
import {
  getIsSwapApproveTransaction,
  getIsSwapApproveOrSwapTransaction,
  getIsSwapTransaction,
  getIsNativeTokenTransferred } from
'../transactions';






import { isProduction } from '../environment';

const TIMEOUT_FOR_SMART_TRANSACTION_CONFIRMATION_DONE_EVENT = 10000;

export const getTransactionType = (
transactionMeta,
chainId) =>
{
  // Determine tx type
  // If it isn't a dapp tx, check if it's MM Swaps or Send
  // process.env.MM_FOX_CODE is from MM Swaps
  const isDapp =
  transactionMeta?.origin !== TransactionTypes.MMM &&
  transactionMeta?.origin !== process.env.MM_FOX_CODE;

  const to = transactionMeta.txParams.to?.toLowerCase();
  const data = transactionMeta.txParams.data; // undefined for send txs of gas tokens

  const isSwapApproveOrSwapTransaction = getIsSwapApproveOrSwapTransaction(
    data,
    transactionMeta.origin,
    to,
    chainId
  );
  const isSwapApproveTx = getIsSwapApproveTransaction(
    data,
    transactionMeta.origin,
    to,
    chainId
  );
  const isSwapTransaction = getIsSwapTransaction(
    data,
    transactionMeta.origin,
    to,
    chainId
  );

  const isNativeTokenTransferred = getIsNativeTokenTransferred(
    transactionMeta.txParams
  );

  const isSend = !isDapp && !isSwapApproveOrSwapTransaction;

  return {
    isDapp,
    isSend,
    isInSwapFlow: isSwapApproveOrSwapTransaction,
    isSwapApproveTx,
    isSwapTransaction,
    isNativeTokenTransferred
  };
};

// Status modal start, update, and close conditions
// If ERC20 if from token in swap and requires additional allowance, Swap txs are the 2nd in the swap flow, so we don't want to show another status page for that
export const getShouldStartApprovalRequest = (
isDapp,
isSend,
isSwapApproveTx,
hasPendingApprovalForSwapApproveTx,
mobileReturnTxHashAsap) =>

!mobileReturnTxHashAsap && (
isDapp || isSend || isSwapApproveTx || !hasPendingApprovalForSwapApproveTx);

export const getShouldUpdateApprovalRequest = (
isDapp,
isSend,
isSwapTransaction,
mobileReturnTxHashAsap) =>

!mobileReturnTxHashAsap && (isDapp || isSend || isSwapTransaction);

const waitForSmartTransactionConfirmationDone = (
controllerMessenger) =>

new Promise((resolve) => {
  controllerMessenger.subscribe(
    'SmartTransactionsController:smartTransactionConfirmationDone',
    async (smartTransaction) => {
      resolve(smartTransaction);
    }
  );
  setTimeout(() => {
    resolve(undefined); // In a rare case we don't get the "smartTransactionConfirmationDone" event within 10 seconds, we resolve with undefined to continue.
  }, TIMEOUT_FOR_SMART_TRANSACTION_CONFIRMATION_DONE_EVENT);
});

export const getSmartTransactionMetricsProperties = async (
smartTransactionsController,
transactionMeta,
waitForSmartTransaction,
controllerMessenger) =>
{
  if (!transactionMeta) return {};
  let smartTransaction =
  smartTransactionsController.getSmartTransactionByMinedTxHash(
    transactionMeta.hash
  );
  const shouldWaitForSmartTransactionConfirmationDoneEvent =
  waitForSmartTransaction &&
  !smartTransaction?.statusMetadata && // We get this after polling for a status for a Smart Transaction.
  controllerMessenger;
  if (shouldWaitForSmartTransactionConfirmationDoneEvent) {
    smartTransaction = await waitForSmartTransactionConfirmationDone(
      controllerMessenger
    );
  }
  if (!smartTransaction?.statusMetadata) {
    return {};
  }
  const { timedOut, proxied } = smartTransaction.statusMetadata;
  return {
    smart_transaction_timed_out: timedOut,
    smart_transaction_proxied: proxied
  };
};



// Currently, we take the first token for gas fee payment, but later, a user can choose which token to use for gas payment.
export const getTradeTxTokenFee = (quote) =>
// @ts-expect-error Property 'tokenFees' does not exist on type 'Fee'. Need to update the type.
quote?.tradeTxFees?.fees?.[0]?.tokenFees?.[0];

// We get gas included fees from a swap quote now. In a future iteration we will have a universal
// implementation that works for non-swaps transactions as well.
export const getGasIncludedTransactionFees = (quote) => {
  const tradeTxTokenFee = getTradeTxTokenFee(quote);
  let transactionFees;
  if (tradeTxTokenFee && quote?.isGasIncludedTrade) {
    transactionFees = {
      approvalTxFees: quote?.approvalTxFees,
      tradeTxFees: quote?.tradeTxFees
    };
  }
  return transactionFees;
};

export const getIsAllowedRpcUrlForSmartTransactions = (rpcUrl) => {
  // Allow in non-production environments.
  if (!isProduction()) {
    return true;
  }

  const hostname = rpcUrl && new URL(rpcUrl).hostname;

  return (
    hostname?.endsWith('.infura.io') ||
    hostname?.endsWith('.binance.org') ||
    false);

};