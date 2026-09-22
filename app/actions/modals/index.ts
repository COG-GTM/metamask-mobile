export interface ToggleNetworkModalAction {
  type: 'TOGGLE_NETWORK_MODAL';
  shouldNetworkSwitchPopToWallet: boolean;
}

export interface ModalVisibilityAction {
  type:
    | 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL'
    | 'TOGGLE_DAPP_TRANSACTION_MODAL'
    | 'TOGGLE_INFO_NETWORK_MODAL'
    | 'TOGGLE_SIGN_MODAL';
  show?: boolean;
}

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction {
  return {
    type: 'TOGGLE_NETWORK_MODAL',
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ModalVisibilityAction {
  return {
    type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  };
}

export function toggleDappTransactionModal(show: boolean): ModalVisibilityAction {
  return {
    type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
    show,
  };
}

export function toggleInfoNetworkModal(show: boolean): ModalVisibilityAction {
  return {
    type: 'TOGGLE_INFO_NETWORK_MODAL',
    show,
  };
}

export function toggleSignModal(show: boolean): ModalVisibilityAction {
  return {
    type: 'TOGGLE_SIGN_MODAL',
    show,
  };
}
