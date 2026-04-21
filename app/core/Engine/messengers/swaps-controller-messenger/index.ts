import { BaseControllerMessenger } from '../../types';

/**
 * Get the SwapsControllerMessenger for the SwapsController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The SwapsControllerMessenger.
 */
export function getSwapsControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'SwapsController',
    // TODO: allow these internal calls once GasFeeController
    // export these action types and register its action handlers
    // allowedActions: [
    //   'GasFeeController:getEIP1559GasFeeEstimates',
    // ],
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
