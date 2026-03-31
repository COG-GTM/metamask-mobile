import { type Action } from 'redux';

/**
 * Modal action type enum
 */
export enum ModalActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

export interface ToggleNetworkModalAction
  extends Action<ModalActionType.TOGGLE_NETWORK_MODAL> {
  shouldNetworkSwitchPopToWallet: boolean;
}

export type ToggleCollectibleContractModalAction =
  Action<ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL>;

export interface ToggleDappTransactionModalAction
  extends Action<ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL> {
  show: boolean | null;
}

export interface ToggleInfoNetworkModalAction
  extends Action<ModalActionType.TOGGLE_INFO_NETWORK_MODAL> {
  show: boolean | null;
}

export interface ToggleSignModalAction
  extends Action<ModalActionType.TOGGLE_SIGN_MODAL> {
  show: boolean | null;
}

/**
 * Union type for all modal actions
 */
export type ModalAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction {
  return {
    type: ModalActionType.TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(
  show: boolean | null,
): ToggleDappTransactionModalAction {
  return {
    type: ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show: boolean | null,
): ToggleInfoNetworkModalAction {
  return {
    type: ModalActionType.TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(
  show: boolean | null,
): ToggleSignModalAction {
  return {
    type: ModalActionType.TOGGLE_SIGN_MODAL,
    show,
  };
}
