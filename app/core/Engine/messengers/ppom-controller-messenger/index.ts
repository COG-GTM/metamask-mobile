import { BaseControllerMessenger } from '../../types';

/**
 * Get the PPOMControllerMessenger for the PPOMController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PPOMControllerMessenger.
 */
export function getPPOMControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  return baseControllerMessenger.getRestricted({
    name: 'PPOMController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: [
      'NetworkController:networkDidChange',
      'PreferencesController:stateChange',
    ],
  });
}
