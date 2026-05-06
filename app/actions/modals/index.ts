import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

export interface ToggleNetworkModalAction
  extends ReduxAction<ActionType.TOGGLE_NETWORK_MODAL> {
  shouldNetworkSwitchPopToWallet: boolean;
}

export interface ToggleCollectibleContractModalAction
  extends ReduxAction<ActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL> {}

export interface ToggleDappTransactionModalAction
  extends ReduxAction<ActionType.TOGGLE_DAPP_TRANSACTION_MODAL> {
  show?: boolean;
}

export interface ToggleInfoNetworkModalAction
  extends ReduxAction<ActionType.TOGGLE_INFO_NETWORK_MODAL> {
  show?: boolean;
}

export interface ToggleSignModalAction
  extends ReduxAction<ActionType.TOGGLE_SIGN_MODAL> {
  show?: boolean;
}

export type Action =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction {
  return {
    type: ActionType.TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: ActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(
  show?: boolean,
): ToggleDappTransactionModalAction {
  return {
    type: ActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show?: boolean,
): ToggleInfoNetworkModalAction {
  return {
    type: ActionType.TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(show?: boolean): ToggleSignModalAction {
  return {
    type: ActionType.TOGGLE_SIGN_MODAL,
    show,
  };
}
