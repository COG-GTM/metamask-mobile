


/**
 * Get the CurrencyRateMessenger for the CurrencyRateController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The CurrencyRateMessenger.
 */
export function getCurrencyRateControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'CurrencyRateController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: []
  });
}