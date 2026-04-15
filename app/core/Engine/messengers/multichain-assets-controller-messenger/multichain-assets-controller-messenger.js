


/**
 * Get the MultichainAssetsControllerMessenger for the MultichainAssetsController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The MultichainAssetsControllerMessenger.
 */
export function getMultichainAssetsControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'MultichainAssetsController',
    allowedEvents: [
    'AccountsController:accountAdded',
    'AccountsController:accountRemoved',
    'AccountsController:accountAssetListUpdated'],

    allowedActions: [
    'PermissionController:getPermissions',
    'SnapController:handleRequest',
    'SnapController:getAll',
    'AccountsController:listMultichainAccounts']

  });
}