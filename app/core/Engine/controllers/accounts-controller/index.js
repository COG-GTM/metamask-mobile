import {
  AccountsController } from


'@metamask/accounts-controller';

import { logAccountsControllerCreation } from './utils';
import { defaultAccountsControllerState } from './constants';

// Export constants
export * from './constants';

/**
 * Initialize the AccountsController.
 *
 * @param request - The request object.
 * @returns The AccountsController.
 */
export const accountsControllerInit =


(request) => {
  const { controllerMessenger, persistedState } = request;

  const accountControllerState = persistedState.AccountsController ??
  defaultAccountsControllerState;

  logAccountsControllerCreation(accountControllerState);

  const controller = new AccountsController({
    messenger: controllerMessenger,
    state: accountControllerState
  });

  return { controller };
};