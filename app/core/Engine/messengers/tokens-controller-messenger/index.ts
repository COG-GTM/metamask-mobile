import { BaseControllerMessenger, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Get the TokensControllerMessenger for the TokensController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The TokensControllerMessenger.
 */
export function getTokensControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): BaseRestrictedControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'TokensController',
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'TokenListController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  });
}
