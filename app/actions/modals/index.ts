export function toggleNetworkModal(shouldNetworkSwitchPopToWallet: boolean = true) {
  return {
    type: 'TOGGLE_NETWORK_MODAL' as const,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal() {
  return {
    type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' as const,
  };
}

export function toggleDappTransactionModal(show: boolean) {
  return {
    type: 'TOGGLE_DAPP_TRANSACTION_MODAL' as const,
    show,
  };
}

export function toggleInfoNetworkModal(show: boolean) {
  return {
    type: 'TOGGLE_INFO_NETWORK_MODAL' as const,
    show,
  };
}

export function toggleSignModal(show: boolean) {
  return {
    type: 'TOGGLE_SIGN_MODAL' as const,
    show,
  };
}
