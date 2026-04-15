




















































export function getTransactionControllerMessenger(
messenger)
{
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  return messenger.getRestricted({
    name: 'TransactionController',
    allowedActions: [
    'AccountsController:getSelectedAccount',
    'AccountsController:getState',
    `ApprovalController:addRequest`,
    'NetworkController:findNetworkClientIdByChainId',
    'NetworkController:getNetworkClientById',
    'RemoteFeatureFlagController:getState'],

    allowedEvents: [`NetworkController:stateChange`]
  });
}

export function getTransactionControllerInitMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'TransactionControllerInit',
    allowedEvents: [
    'TransactionController:transactionApproved',
    'TransactionController:transactionConfirmed',
    'TransactionController:transactionDropped',
    'TransactionController:transactionFailed',
    'TransactionController:transactionRejected',
    'TransactionController:transactionSubmitted',
    'TransactionController:unapprovedTransactionAdded',
    'SmartTransactionsController:smartTransaction',
    'SmartTransactionsController:smartTransactionConfirmationDone'],

    allowedActions: [
    'ApprovalController:addRequest',
    'ApprovalController:endFlow',
    'ApprovalController:startFlow',
    'ApprovalController:updateRequestState',
    'NetworkController:getEIP1559Compatibility']

  });
}