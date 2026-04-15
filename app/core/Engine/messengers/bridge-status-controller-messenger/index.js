


/**
 * Get the BridgeControllerMessenger for the BridgeController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The BridgeControllerMessenger.
 */
export function getBridgeStatusControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'BridgeStatusController',
    allowedActions: [
    'AccountsController:getSelectedAccount',
    'NetworkController:getNetworkClientById',
    'NetworkController:findNetworkClientIdByChainId',
    'NetworkController:getState',
    'TransactionController:getState'],

    allowedEvents: []
  });
}