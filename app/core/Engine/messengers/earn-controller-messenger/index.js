


/**
 * Get the EarnControllerMessenger for the EarnController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The EarnControllerMessenger.
 */
export function getEarnControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'EarnController',
    allowedEvents: [
    'AccountsController:selectedAccountChange',
    'NetworkController:stateChange',
    'TransactionController:transactionConfirmed'],

    allowedActions: [
    'AccountsController:getSelectedAccount',
    'NetworkController:getNetworkClientById',
    'NetworkController:getState']

  });
}