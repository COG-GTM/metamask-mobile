

import Logger from '../../../util/Logger';

export function logEngineCreation(
initialState = {},
initialKeyringState)
{
  if (Object.keys(initialState).length === 0) {
    Logger.log('Engine initialized with empty state', {
      keyringStateFromBackup: !!initialKeyringState
    });
  } else {
    Logger.log('Engine initialized with non-empty state', {
      hasAccountsState: !!initialState.AccountsController,
      hasKeyringState: !!initialState.KeyringController,
      keyringStateFromBackup: !!initialKeyringState
    });
  }
}