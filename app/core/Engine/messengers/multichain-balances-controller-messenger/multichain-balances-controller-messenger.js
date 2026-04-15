


/**
 * Get the MultichainBalancesControllerMessenger for the MultichainBalancesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The MultichainBalancesControllerMessenger.
 */
export function getMultichainBalancesControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'MultichainBalancesController',
    allowedEvents: [
    'AccountsController:accountAdded',
    'AccountsController:accountRemoved',
    'AccountsController:accountBalancesUpdated',
    'MultichainAssetsController:stateChange'],

    allowedActions: [
    'AccountsController:listMultichainAccounts',
    'SnapController:handleRequest',
    'MultichainAssetsController:getState',
    'KeyringController:getState']

  });
}