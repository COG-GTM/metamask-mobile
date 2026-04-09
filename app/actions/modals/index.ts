import {
  type ToggleNetworkModalAction,
  type ToggleCollectibleContractModalAction,
  type ToggleDappTransactionModalAction,
  type ToggleInfoNetworkModalAction,
  type ToggleSignModalAction,
  ModalActionType,
} from './types';

export * from './types';

export function toggleNetworkModal(
  shouldNetworkSwitchPopToWallet = true,
): ToggleNetworkModalAction {
  return {
    type: ModalActionType.TOGGLE_NETWORK_MODAL,
    shouldNetworkSwitchPopToWallet,
  };
}

export function toggleCollectibleContractModal(): ToggleCollectibleContractModalAction {
  return {
    type: ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  };
}

export function toggleDappTransactionModal(
  show?: boolean | null,
): ToggleDappTransactionModalAction {
  return {
    type: ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
    show,
  };
}

export function toggleInfoNetworkModal(
  show?: boolean | null,
): ToggleInfoNetworkModalAction {
  return {
    type: ModalActionType.TOGGLE_INFO_NETWORK_MODAL,
    show,
  };
}

export function toggleSignModal(
  show?: boolean | null,
): ToggleSignModalAction {
  return {
    type: ModalActionType.TOGGLE_SIGN_MODAL,
    show,
  };
}
