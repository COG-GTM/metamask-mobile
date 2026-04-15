











const name = 'GasFeeController';











// This is not exported from the gas-fee-controller package right now








export function getGasFeeControllerMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'GasFeeController',
    allowedActions: [
    'NetworkController:getEIP1559Compatibility',
    'NetworkController:getNetworkClientById',
    'NetworkController:getState'],

    allowedEvents: ['NetworkController:networkDidChange']
  });
}