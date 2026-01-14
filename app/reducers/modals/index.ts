export const TOGGLE_NETWORK_MODAL = 'TOGGLE_NETWORK_MODAL';
export const TOGGLE_COLLECTIBLE_CONTRACT_MODAL =
  'TOGGLE_COLLECTIBLE_CONTRACT_MODAL';
export const TOGGLE_DAPP_TRANSACTION_MODAL = 'TOGGLE_DAPP_TRANSACTION_MODAL';
export const TOGGLE_INFO_NETWORK_MODAL = 'TOGGLE_INFO_NETWORK_MODAL';
export const TOGGLE_SIGN_MODAL = 'TOGGLE_SIGN_MODAL';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

interface ToggleNetworkModalAction {
  type: typeof TOGGLE_NETWORK_MODAL;
  shouldNetworkSwitchPopToWallet?: boolean;
}

interface ToggleCollectibleContractModalAction {
  type: typeof TOGGLE_COLLECTIBLE_CONTRACT_MODAL;
}

interface ToggleDappTransactionModalAction {
  type: typeof TOGGLE_DAPP_TRANSACTION_MODAL;
  show?: boolean | null;
}

interface ToggleInfoNetworkModalAction {
  type: typeof TOGGLE_INFO_NETWORK_MODAL;
  show?: boolean;
}

interface ToggleSignModalAction {
  type: typeof TOGGLE_SIGN_MODAL;
  show?: boolean;
}

type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction;

const initialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

const modalsReducer = (
  state: ModalsState = initialState,
  action: ModalsAction,
): ModalsState => {
  switch (action.type) {
    case TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet:
          action.shouldNetworkSwitchPopToWallet ??
          state.shouldNetworkSwitchPopToWallet,
      };
    case TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case TOGGLE_DAPP_TRANSACTION_MODAL:
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
    case TOGGLE_INFO_NETWORK_MODAL:
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
    case TOGGLE_SIGN_MODAL:
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
