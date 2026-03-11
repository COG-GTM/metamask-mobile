export const TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL' as const;
export const TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' as const;
export const TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL' as const;
export const TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL' as const;
export const TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL' as const;

interface ToggleNetworkModalAction {
  type: typeof TOGGLE_NETWORK_MODAL;
  shouldNetworkSwitchPopToWallet: boolean;
}

interface ToggleCollectibleContractModalAction {
  type: typeof TOGGLE_COLLECTIBLE_CONTRACT_MODAL;
}

interface ToggleDappTransactionModalAction {
  type: typeof TOGGLE_DAPP_TRANSACTION_MODAL;
  show: boolean | null | undefined;
}

interface ToggleInfoNetworkModalAction {
  type: typeof TOGGLE_INFO_NETWORK_MODAL;
  show: boolean | null | undefined;
}

interface ToggleSignModalAction {
  type: typeof TOGGLE_SIGN_MODAL;
  show: boolean | null | undefined;
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
    type: TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(
  show?: boolean | null,
): ToggleDappTransactionModalAction {
  return {
    type: TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show?: boolean | null,
): ToggleInfoNetworkModalAction {
  return {
    type: TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(
  show?: boolean | null,
): ToggleSignModalAction {
  return {
    type: TOGGLE_SIGN_MODAL,
    show,
  };
}
