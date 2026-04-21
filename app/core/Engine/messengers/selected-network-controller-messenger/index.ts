import { SelectedNetworkControllerMessenger } from '@metamask/selected-network-controller';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the SelectedNetworkControllerMessenger for the SelectedNetworkController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The SelectedNetworkControllerMessenger.
 */
export function getSelectedNetworkControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): SelectedNetworkControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'SelectedNetworkController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'NetworkController:getSelectedNetworkClient',
      'PermissionController:hasPermissions',
      'PermissionController:getSubjectNames',
    ],
    allowedEvents: [
      'NetworkController:stateChange',
      'PermissionController:stateChange',
    ],
  });
}
