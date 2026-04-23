import type { TokenDetectionControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the TokenDetectionControllerMessenger for the TokenDetectionController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenDetectionControllerMessenger.
 */
export function getTokenDetectionControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): TokenDetectionControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenDetectionController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getState',
      'KeyringController:getState',
      'PreferencesController:getState',
      'TokenListController:getState',
      'TokensController:getState',
      'TokensController:addDetectedTokens',
      'AccountsController:getAccount',
    ],
    allowedEvents: [
      'KeyringController:lock',
      'KeyringController:unlock',
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
      'TokenListController:stateChange',
      'TokensController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  });
}
