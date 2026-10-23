import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  iAccountActions,
  SetReloadAccountsAction,
} from '../../actions/accounts';

/**
 * Interface for defining what properties will be defined in store
 */
export interface AccountsState {
  reloadAccounts: boolean;
}

export type iAccountEvent = AccountsState;

/**
 * Initial state of the Accounts event flow
 */
export const initialState: AccountsState = {
  reloadAccounts: false,
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      ActionType.SET_RELOAD_ACCOUNTS,
      (state, action: SetReloadAccountsAction) => ({
        ...state,
        reloadAccounts: action.reloadAccounts,
      }),
    );
  },
});

/**
 * Reducer to Account relative event
 * @param {AccountsState} state: the state of the Accounts event flow, default to initialState
 * @param {iAccountActions} action: the action object contain type and payload to change state.
 * @returns {AccountsState}: the new state of the Accounts event flow
 */
const accountReducer = (
  state: AccountsState | undefined,
  // Keeps the legacy default so a call without an action still returns state.
  action: iAccountActions = {
    type: '',
    reloadAccounts: false,
  },
): AccountsState => accountsSlice.reducer(state, action);

export default accountReducer;
