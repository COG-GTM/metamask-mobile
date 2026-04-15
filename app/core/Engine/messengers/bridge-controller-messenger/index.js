


/**
 * Get the BridgeControllerMessenger for the BridgeController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The BridgeControllerMessenger.
 */
export function getBridgeControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'BridgeController',
    allowedActions: [
    'AccountsController:getSelectedAccount',
    'NetworkController:findNetworkClientIdByChainId',
    'NetworkController:getState',
    'NetworkController:getNetworkClientById'],

    allowedEvents: []
  });
}