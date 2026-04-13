export const TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL' as const;
export const TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' as const;
export const TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL' as const;
export const TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL' as const;
export const TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL' as const;

export type ModalAction =
  | { type: typeof TOGGLE_NETWORK_MODAL; shouldNetworkSwitchPopToWallet: boolean }
  | { type: typeof TOGGLE_COLLECTIBLE_CONTRACT_MODAL }
  | { type: typeof TOGGLE_DAPP_TRANSACTION_MODAL; show: boolean }
  | { type: typeof TOGGLE_INFO_NETWORK_MODAL; show: boolean }
  | { type: typeof TOGGLE_SIGN_MODAL; show: boolean };

export function toggleNetworkModal(shouldNetworkSwitchPopToWallet = true) {
  return {
    type: TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  } as const;
}

export function toggleCollectibleContractModal() {
  return {
    type: TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  } as const;
}

export function toggleDappTransactionModal(show: boolean) {
  return {
    type: TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  } as const;
}

export function toggleInfoNetworkModal(show: boolean) {
  return {
    type: TOGGLE_INFO_NETWORK_MODAL,
    show,
  } as const;
}

export function toggleSignModal(show: boolean) {
  return {
    type: TOGGLE_SIGN_MODAL,
    show,
  } as const;
}
