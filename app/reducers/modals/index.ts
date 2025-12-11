/**
 * Modals action types
 */
export enum ModalsActionType {
  TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL',
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL = 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
  TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL',
  TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL',
  TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL',
}

/**
 * Modals state interface
 */
export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

/**
 * Modals action interfaces
 */
interface ToggleNetworkModalAction {
  type: ModalsActionType.TOGGLE_NETWORK_MODAL;
  shouldNetworkSwitchPopToWallet?: boolean;
}

interface ToggleCollectibleContractModalAction {
  type: ModalsActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL;
}

interface ToggleDappTransactionModalAction {
  type: ModalsActionType.TOGGLE_DAPP_TRANSACTION_MODAL;
  show?: boolean | null;
}

interface ToggleInfoNetworkModalAction {
  type: ModalsActionType.TOGGLE_INFO_NETWORK_MODAL;
  show?: boolean;
}

interface ToggleSignModalAction {
  type: ModalsActionType.TOGGLE_SIGN_MODAL;
  show?: boolean;
}

/**
 * Union type of all modals actions
 */
export type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

/**
 * Initial modals state
 */
export const modalsInitialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

/**
 * Modals reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const modalsReducer = (
  state: ModalsState = modalsInitialState,
  action: ModalsAction,
): ModalsState => {
  switch (action.type) {
    case ModalsActionType.TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet:
          action.shouldNetworkSwitchPopToWallet ?? true,
      };
    case ModalsActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case ModalsActionType.TOGGLE_DAPP_TRANSACTION_MODAL:
      if (action.show === false) {
        return {
          ...state,
          dappTransactionModalVisible: false,
        };
      }
      return {
        ...state,
        dappTransactionModalVisible:
          action.show === null
            ? !state.dappTransactionModalVisible
            : (action.show ?? !state.dappTransactionModalVisible),
      };
    case ModalsActionType.TOGGLE_INFO_NETWORK_MODAL:
      if (action.show === false) {
        return {
          ...state,
          infoNetworkModalVisible: false,
        };
      }
      return {
        ...state,
        infoNetworkModalVisible: !state.infoNetworkModalVisible,
      };
    case ModalsActionType.TOGGLE_SIGN_MODAL:
      if (action.show === false) {
        return {
          ...state,
          signMessageModalVisible: false,
        };
      }
      return {
        ...state,
        signMessageModalVisible: !state.signMessageModalVisible,
      };
    default:
      return state;
  }
};

export default modalsReducer;
