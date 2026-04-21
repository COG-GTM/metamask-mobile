import type { AssetsContractControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the AssetsContractControllerMessenger for the AssetsContractController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The AssetsContractControllerMessenger.
 */
export function getAssetsContractControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): AssetsContractControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'AssetsContractController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
}
