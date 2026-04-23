import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the TokenRatesControllerMessenger for the TokenRatesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenRatesControllerMessenger.
 */
export function getTokenRatesControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenRatesController',
    allowedActions: [
      'TokensController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      'TokensController:stateChange',
      'NetworkController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  });
}
