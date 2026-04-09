import { type Action } from 'redux';

// Action type enum
export enum ModalActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

export type ToggleNetworkModalAction =
  Action<ModalActionType.TOGGLE_NETWORK_MODAL> & {
    shouldNetworkSwitchPopToWallet: boolean;
  };

export type ToggleCollectibleContractModalAction =
  Action<ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL>;

export type ToggleDappTransactionModalAction =
  Action<ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL> & {
    show: boolean | null | undefined;
  };

export type ToggleInfoNetworkModalAction =
  Action<ModalActionType.TOGGLE_INFO_NETWORK_MODAL> & {
    show: boolean | null | undefined;
  };

export type ToggleSignModalAction =
  Action<ModalActionType.TOGGLE_SIGN_MODAL> & {
    show: boolean | null | undefined;
  };

/**
 * Modal actions union type
 */
export type ModalAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;
