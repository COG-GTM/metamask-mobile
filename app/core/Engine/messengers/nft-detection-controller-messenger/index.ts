import { NftDetectionControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the NftDetectionControllerMessenger for the NftDetectionController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The NftDetectionControllerMessenger.
 */
export function getNftDetectionControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): NftDetectionControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'NftDetectionController',
    allowedEvents: [
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
    ],
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'PreferencesController:getState',
      'AccountsController:getSelectedAccount',
    ],
  });
}
