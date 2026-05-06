import type { Action } from 'redux';

export interface ToggleNetworkModalAction
  extends Action<'TOGGLE_NETWORK_MODAL'> {
  shouldNetworkSwitchPopToWallet: boolean;
}

export type ToggleCollectibleContractModalAction =
  Action<'TOGGLE_COLLECTIBLE_CONTRACT_MODAL'>;

export interface ToggleDappTransactionModalAction
  extends Action<'TOGGLE_DAPP_TRANSACTION_MODAL'> {
  show?: boolean;
}

export interface ToggleInfoNetworkModalAction
  extends Action<'TOGGLE_INFO_NETWORK_MODAL'> {
  show?: boolean;
}

export interface ToggleSignModalAction extends Action<'TOGGLE_SIGN_MODAL'> {
  show?: boolean;
}

export type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction {
  return {
    type: 'TOGGLE_NETWORK_MODAL',
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  };
}

export function toggleDappTransactionModal(
  show?: boolean,
): ToggleDappTransactionModalAction {
  return {
    type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
    show,
  };
}

export function toggleInfoNetworkModal(
  show?: boolean,
): ToggleInfoNetworkModalAction {
  return {
    type: 'TOGGLE_INFO_NETWORK_MODAL',
    show,
  };
}

export function toggleSignModal(show?: boolean): ToggleSignModalAction {
  return {
    type: 'TOGGLE_SIGN_MODAL',
    show,
  };
}
