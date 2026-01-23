export const ModalActionTypes = {
  TOGGLE_NETWORK_MODAL: 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL: 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL: 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL: 'TOGGLE_SIGN_MODAL',
} as const;

export interface ToggleNetworkModalAction {
  type: typeof ModalActionTypes.TOGGLE_NETWORK_MODAL;
  shouldNetworkSwitchPopToWallet: boolean;
}

export interface ToggleCollectibleContractModalAction {
  type: typeof ModalActionTypes.TOGGLE_COLLECTIBLE_CONTRACT_MODAL;
}

export interface ToggleDappTransactionModalAction {
  type: typeof ModalActionTypes.TOGGLE_DAPP_TRANSACTION_MODAL;
  show: boolean | null;
}

export interface ToggleInfoNetworkModalAction {
  type: typeof ModalActionTypes.TOGGLE_INFO_NETWORK_MODAL;
  show: boolean | null;
}

export interface ToggleSignModalAction {
  type: typeof ModalActionTypes.TOGGLE_SIGN_MODAL;
  show: boolean | null;
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
    type: ModalActionTypes.TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: ModalActionTypes.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(
  show: boolean | null,
): ToggleDappTransactionModalAction {
  return {
    type: ModalActionTypes.TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show: boolean | null,
): ToggleInfoNetworkModalAction {
  return {
    type: ModalActionTypes.TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(show: boolean | null): ToggleSignModalAction {
  return {
    type: ModalActionTypes.TOGGLE_SIGN_MODAL,
    show,
  };
}
