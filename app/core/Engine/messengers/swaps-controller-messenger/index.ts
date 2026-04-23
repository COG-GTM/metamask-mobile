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
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  return baseControllerMessenger.getRestricted({
    name: 'SwapsController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
