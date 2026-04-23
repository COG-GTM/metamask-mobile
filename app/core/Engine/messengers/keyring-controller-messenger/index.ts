import { KeyringControllerMessenger } from '@metamask/keyring-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the KeyringControllerMessenger for the KeyringController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The KeyringControllerMessenger.
 */
export function getKeyringControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): KeyringControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'KeyringController',
    allowedActions: [],
    allowedEvents: [],
  });
}
