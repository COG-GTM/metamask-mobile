export interface ToggleNetworkModalAction {
  type: 'TOGGLE_NETWORK_MODAL';
  shouldNetworkSwitchPopToWallet: boolean | null | undefined;
}

export interface ToggleCollectibleContractModalAction {
  type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL';
}

export interface ToggleDappTransactionModalAction {
  type: 'TOGGLE_DAPP_TRANSACTION_MODAL';
  show: boolean | null | undefined;
}

export interface ToggleInfoNetworkModalAction {
  type: 'TOGGLE_INFO_NETWORK_MODAL';
  show: boolean | null | undefined;
}

export interface ToggleSignModalAction {
  type: 'TOGGLE_SIGN_MODAL';
  show: boolean | null | undefined;
}

export type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet: boolean | null | undefined = true,
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
  show: boolean | null | undefined,
): ToggleDappTransactionModalAction {
  return {
    type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
    show,
  };
}

export function toggleInfoNetworkModal(
  show: boolean | null | undefined,
): ToggleInfoNetworkModalAction {
  return {
    type: 'TOGGLE_INFO_NETWORK_MODAL',
    show,
  };
}

export function toggleSignModal(
  show: boolean | null | undefined,
): ToggleSignModalAction {
  return {
    type: 'TOGGLE_SIGN_MODAL',
    show,
  };
}
