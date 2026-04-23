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
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  return baseControllerMessenger.getRestricted({
    name: 'SmartTransactionsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  });
}
