import { type Action } from 'redux';

/**
 * Modals action type enum
 */
export enum ModalsActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

/**
 * Modals actions
 */
export interface ToggleNetworkModalAction extends Action<ModalsActionType.TOGGLE_NETWORK_MODAL> {
  shouldNetworkSwitchPopToWallet: boolean;
}

export type ToggleCollectibleContractModalAction = Action<ModalsActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL>;

export interface ToggleDappTransactionModalAction extends Action<ModalsActionType.TOGGLE_DAPP_TRANSACTION_MODAL> {
  show: boolean | null;
}

export interface ToggleInfoNetworkModalAction extends Action<ModalsActionType.TOGGLE_INFO_NETWORK_MODAL> {
  show: boolean | null;
}

export interface ToggleSignModalAction extends Action<ModalsActionType.TOGGLE_SIGN_MODAL> {
  show: boolean | null;
}

/**
 * Modals actions union type
 */
export type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;
