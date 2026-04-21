import { BaseControllerMessenger } from '../../types';

/**
 * Get the RatesControllerMessenger for the RatesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The RatesControllerMessenger.
 */
export function getRatesControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'RatesController',
    allowedActions: [],
    allowedEvents: ['CurrencyRateController:stateChange'],
  });
}
