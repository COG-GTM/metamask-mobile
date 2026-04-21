import type { TokenListControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the TokenListControllerMessenger for the TokenListController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenListControllerMessenger.
 */
export function getTokenListControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): TokenListControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenListController',
    allowedActions: [`NetworkController:getNetworkClientById`],
    allowedEvents: [`NetworkController:stateChange`],
  });
}
