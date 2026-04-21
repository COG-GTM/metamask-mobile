import { PreferencesControllerMessenger } from '@metamask/preferences-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the PreferencesControllerMessenger for the PreferencesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The PreferencesControllerMessenger.
 */
export function getPreferencesControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): PreferencesControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'PreferencesController',
    allowedActions: [],
    allowedEvents: ['KeyringController:stateChange'],
  });
}
