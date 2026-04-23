import type {
  KeyringControllerActions,
  KeyringControllerEvents,
} from '@metamask/keyring-controller';
import { RestrictedMessenger } from '@metamask/base-controller';
import { BaseControllerMessenger } from '../../types';

const name = 'KeyringController';

export type KeyringControllerMessenger = RestrictedMessenger<
  typeof name,
  KeyringControllerActions,
  KeyringControllerEvents,
  never,
  never
>;

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
