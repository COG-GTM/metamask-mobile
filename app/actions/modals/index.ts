interface ToggleNetworkModalAction {
  type: 'TOGGLE_NETWORK_MODAL';
  shouldNetworkSwitchPopToWallet: boolean;
}

interface ToggleCollectibleContractModalAction {
  type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL';
}

interface ToggleDappTransactionModalAction {
  type: 'TOGGLE_DAPP_TRANSACTION_MODAL';
  show: boolean | null;
}

interface ToggleInfoNetworkModalAction {
  type: 'TOGGLE_INFO_NETWORK_MODAL';
  show: boolean | null;
}

interface ToggleSignModalAction {
  type: 'TOGGLE_SIGN_MODAL';
  show: boolean | null;
}

export type ModalActionTypes =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export function toggleNetworkModal(shouldNetworkSwitchPopToWallet = true): ToggleNetworkModalAction {
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

export function toggleDappTransactionModal(show: boolean | null): ToggleDappTransactionModalAction {
  return {
    type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
    show,
  };
}

export function toggleInfoNetworkModal(show: boolean | null): ToggleInfoNetworkModalAction {
  return {
    type: 'TOGGLE_INFO_NETWORK_MODAL',
    show,
  };
}

export function toggleSignModal(show: boolean | null): ToggleSignModalAction {
  return {
    type: 'TOGGLE_SIGN_MODAL',
    show,
  };
}
