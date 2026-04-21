import { BaseControllerMessenger } from '../../types';

/**
 * Get the SmartTransactionsControllerMessenger for the SmartTransactionsController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The SmartTransactionsControllerMessenger.
 */
export function getSmartTransactionsControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'SmartTransactionsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  });
}
