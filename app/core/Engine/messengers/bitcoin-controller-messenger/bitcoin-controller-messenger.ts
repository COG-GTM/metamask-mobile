import type { BitcoinControllerMessenger } from '../../controllers/bitcoin-controller';
import type { BaseControllerMessenger } from '../../types';

/**
 * Get the BitcoinControllerMessenger for the BitcoinController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The BitcoinControllerMessenger.
 */
export function getBitcoinControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BitcoinControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'BitcoinController',
    allowedEvents: ['KeyringController:stateChange'],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'KeyringController:getState',
    ],
  });
}
