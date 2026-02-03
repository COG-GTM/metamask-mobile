/* eslint-disable import/prefer-default-export */
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
  show?: boolean | null;
}

export interface ToggleInfoNetworkModalAction
  extends ReduxAction<ActionType.TOGGLE_INFO_NETWORK_MODAL> {
  show?: boolean | null;
}

export interface ToggleSignModalAction
  extends ReduxAction<ActionType.TOGGLE_SIGN_MODAL> {
  show?: boolean | null;
}

export type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export const toggleNetworkModal = (
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction => ({
  type: ActionType.TOGGLE_NETWORK_MODAL,
  shouldNetworkSwitchPopToWallet,
});

export const toggleCollectibleContractModal =
  (): ToggleCollectibleContractModalAction => ({
    type: ActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  });

export const toggleDappTransactionModal = (
  show?: boolean | null,
): ToggleDappTransactionModalAction => ({
  type: ActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
  show,
});

export const toggleInfoNetworkModal = (
  show?: boolean | null,
): ToggleInfoNetworkModalAction => ({
  type: ActionType.TOGGLE_INFO_NETWORK_MODAL,
  show,
});

export const toggleSignModal = (
  show?: boolean | null,
): ToggleSignModalAction => ({
  type: ActionType.TOGGLE_SIGN_MODAL,
  show,
});
