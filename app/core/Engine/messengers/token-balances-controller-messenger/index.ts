import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the TokenBalancesControllerMessenger for the TokenBalancesController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokenBalancesControllerMessenger.
 */
export function getTokenBalancesControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokenBalancesController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'TokensController:getState',
      'PreferencesController:getState',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      'TokensController:stateChange',
      'PreferencesController:stateChange',
      'NetworkController:stateChange',
    ],
  });
}
