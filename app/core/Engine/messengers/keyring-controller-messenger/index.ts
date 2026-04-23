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

export type KeyringControllerInitMessenger = ReturnType<
  typeof getKeyringControllerInitMessenger
>;

/**
 * Get an init messenger for the KeyringController.
 * Creates the SnapKeyring restricted messenger from the base messenger,
 * needed by the snap keyring builder during controller initialization.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The SnapKeyring restricted messenger.
 */
export function getKeyringControllerInitMessenger(
  baseControllerMessenger: BaseControllerMessenger,
) {
  return baseControllerMessenger.getRestricted({
    name: 'SnapKeyring',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'ApprovalController:startFlow',
      'ApprovalController:endFlow',
      'ApprovalController:showSuccess',
      'ApprovalController:showError',
      'PhishingController:testOrigin',
      'PhishingController:maybeUpdateState',
      'KeyringController:getAccounts',
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:setAccountNameAndSelectAccount',
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'SnapController:get',
    ],
    allowedEvents: [],
  });
}
