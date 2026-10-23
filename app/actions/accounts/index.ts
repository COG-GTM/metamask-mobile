import type { Action as ReduxAction } from 'redux';

/**
 * Deference action types available for different RPC event flow
 */
export enum ActionType {
  SET_RELOAD_ACCOUNTS = 'SET_RELOAD_ACCOUNTS',
}

export { ActionType as AccountsActionType };

/**
 * Extend redux Action interface to add rpcName, eventStage and error properties
 */
export interface iAccountActions extends ReduxAction {
  reloadAccounts: boolean;
}

export interface SetReloadAccountsAction
  extends ReduxAction<ActionType.SET_RELOAD_ACCOUNTS> {
  reloadAccounts: boolean;
}

export type Action = SetReloadAccountsAction;

/**
 * setReloadAccounts action creator
 * @param {boolean} reloadAccounts: true to reload accounts, false otherwise
 * @returns {SetReloadAccountsAction} - the action object to set reloadAccounts
 */
export function setReloadAccounts(
  reloadAccounts: boolean,
): SetReloadAccountsAction {
  return {
    type: ActionType.SET_RELOAD_ACCOUNTS,
    reloadAccounts,
  };
}
