





import Engine from '../../core/Engine';

import { selectBasicFunctionalityEnabled } from '../../selectors/settings';
import { store } from '../../store';

export async function addTransaction(
transaction,
opts)
{
  const { TransactionController } = Engine.context;

  return await TransactionController.addTransaction(transaction, opts);
}

// Keeping this export as function to put more logic in the future
export async function estimateGas(
transaction,
networkClientId)
{
  const { TransactionController } = Engine.context;
  return await TransactionController.estimateGas(transaction, networkClientId);
}

export async function estimateGasFee({
  transactionParams,
  chainId



}) {
  const { TransactionController } = Engine.context;

  return await TransactionController.estimateGasFee({
    transactionParams,
    chainId
  });
}

// Proxy methods
export function handleMethodData(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.handleMethodData(...args);
}

export function getNonceLock(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.getNonceLock(...args);
}

export function speedUpTransaction(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.speedUpTransaction(...args);
}

export function startIncomingTransactionPolling() {
  const isBasicFunctionalityToggleEnabled = selectBasicFunctionalityEnabled(
    store.getState()
  );

  if (isBasicFunctionalityToggleEnabled) {
    const { TransactionController } = Engine.context;
    return TransactionController.startIncomingTransactionPolling();
  }
}

export function stopIncomingTransactionPolling() {
  const { TransactionController } = Engine.context;
  return TransactionController.stopIncomingTransactionPolling();
}

export function updateIncomingTransactions() {
  const isBasicFunctionalityToggleEnabled = selectBasicFunctionalityEnabled(
    store.getState()
  );

  if (isBasicFunctionalityToggleEnabled) {
    const { TransactionController } = Engine.context;
    return TransactionController.updateIncomingTransactions();
  }
}

export function updateSecurityAlertResponse(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.updateSecurityAlertResponse(...args);
}

export function updateTransaction(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.updateTransaction(...args);
}

export function wipeTransactions(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.wipeTransactions(...args);
}

export function updateEditableParams(
...args)
{
  const { TransactionController } = Engine.context;
  return TransactionController.updateEditableParams(...args);
}

export const getNetworkNonce = async (
{ from },
networkClientId) =>
{
  const { nextNonce, releaseLock } = await getNonceLock(from, networkClientId);

  releaseLock();

  return nextNonce;
};