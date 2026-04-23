import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the PreferencesControllerMessenger for the PreferencesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PreferencesControllerMessenger.
 */
export function getPreferencesControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'PreferencesController',
    allowedActions: [],
    allowedEvents: ['KeyringController:stateChange'],
  });
}
