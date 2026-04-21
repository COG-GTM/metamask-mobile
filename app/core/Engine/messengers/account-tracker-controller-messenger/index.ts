import { AccountTrackerControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the AccountTrackerControllerMessenger for the AccountTrackerController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The AccountTrackerControllerMessenger.
 */
export function getAccountTrackerControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): AccountTrackerControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'AccountTrackerController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'PreferencesController:getState',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [
      'AccountsController:selectedEvmAccountChange',
      'AccountsController:selectedAccountChange',
    ],
  });
}
