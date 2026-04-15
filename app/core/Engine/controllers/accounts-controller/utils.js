
import Logger from '../../../../util/Logger';
import { defaultAccountsControllerState } from './constants';

export function logAccountsControllerCreation(
initialState)
{
  if (!initialState) {
    Logger.log('Creating AccountsController with default state', {
      defaultState: defaultAccountsControllerState
    });
  } else {
    Logger.log('Creating AccountsController with provided initial state', {
      hasSelectedAccount: !!initialState.internalAccounts?.selectedAccount,
      accountsCount: Object.keys(initialState.internalAccounts?.accounts || {}).
      length
    });
  }
}