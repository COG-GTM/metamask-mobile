


/**
 * Get the MultichainNetworkControllerMessenger for the MultichainNetworkController.
 *
 * @param baseControllerMessenger - The base controllyer messenger.
 * @returns The MultichainNetworkControllerMessenger.
 */
export function getMultichainNetworkControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'MultichainNetworkController',
    allowedActions: [
    'NetworkController:setActiveNetwork',
    'NetworkController:getState'],

    allowedEvents: ['AccountsController:selectedAccountChange']
  });
}