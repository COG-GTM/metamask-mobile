export const TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL' as const;
export const TOGGLE_COLLECTIBLE_CONTRACT_MODAL =
  'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' as const;
export const TOGGLE_DAPP_TRANSACTION_MODAL =
  'TOGGLE_DAPP_TRANSACTION_MODAL' as const;
export const TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL' as const;
export const TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL' as const;

export function toggleNetworkModal(shouldNetworkSwitchPopToWallet = true) {
  return {
    type: TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal() {
  return {
    type: TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(show?: boolean | null) {
  return {
    type: TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(show?: boolean | null) {
  return {
    type: TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(show?: boolean | null) {
  return {
    type: TOGGLE_SIGN_MODAL,
    show,
  };
}
