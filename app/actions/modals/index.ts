import type { Action as ReduxAction } from 'redux';

export enum ModalActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

export interface ToggleNetworkModalAction
  extends ReduxAction<ModalActionType.TOGGLE_NETWORK_MODAL> {
  shouldNetworkSwitchPopToWallet: boolean;
}

export interface ToggleCollectibleContractModalAction
  extends ReduxAction<ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL> {}

export interface ToggleDappTransactionModalAction
  extends ReduxAction<ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL> {
  show: boolean | null | undefined;
}

export interface ToggleInfoNetworkModalAction
  extends ReduxAction<ModalActionType.TOGGLE_INFO_NETWORK_MODAL> {
  show: boolean | null | undefined;
}

export interface ToggleSignModalAction
  extends ReduxAction<ModalActionType.TOGGLE_SIGN_MODAL> {
  show: boolean | null | undefined;
}

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
  show?: boolean | null,
): ToggleDappTransactionModalAction {
  return {
    type: ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show?: boolean | null,
): ToggleInfoNetworkModalAction {
  return {
    type: ModalActionType.TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(
  show?: boolean | null,
): ToggleSignModalAction {
  return {
    type: ModalActionType.TOGGLE_SIGN_MODAL,
    show,
  };
}
