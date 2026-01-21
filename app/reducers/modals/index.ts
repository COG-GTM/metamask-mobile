import { Action } from 'redux';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

interface ToggleNetworkModalAction extends Action<'TOGGLE_NETWORK_MODAL'> {
  shouldNetworkSwitchPopToWallet: boolean;
}

interface ToggleCollectibleContractModalAction extends Action<'TOGGLE_COLLECTIBLE_CONTRACT_MODAL'> {}

interface ToggleDappTransactionModalAction extends Action<'TOGGLE_DAPP_TRANSACTION_MODAL'> {
  show: boolean | null;
}

interface ToggleInfoNetworkModalAction extends Action<'TOGGLE_INFO_NETWORK_MODAL'> {
  show: boolean | null;
}

interface ToggleSignModalAction extends Action<'TOGGLE_SIGN_MODAL'> {
  show: boolean | null;
}

type ModalsAction =
  | ToggleNetworkModalAction
  | ToggleCollectibleContractModalAction
  | ToggleDappTransactionModalAction
  | ToggleInfoNetworkModalAction
  | ToggleSignModalAction
  | Action<string>;

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
    case 'TOGGLE_NETWORK_MODAL':
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: (action as ToggleNetworkModalAction).shouldNetworkSwitchPopToWallet,
      };
    case 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL':
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case 'TOGGLE_DAPP_TRANSACTION_MODAL': {
      const dappAction = action as ToggleDappTransactionModalAction;
      if (dappAction.show === false) {
        return {
          ...state,
          dappTransactionModalVisible: false,
        };
      }
      return {
        ...state,
        dappTransactionModalVisible:
          dappAction.show === null
            ? !state.dappTransactionModalVisible
            : dappAction.show,
      };
    }
    case 'TOGGLE_INFO_NETWORK_MODAL': {
      const infoAction = action as ToggleInfoNetworkModalAction;
      if (infoAction.show === false) {
        return {
          ...state,
          infoNetworkModalVisible: false,
        };
      }
      return {
        ...state,
        infoNetworkModalVisible: !state.infoNetworkModalVisible,
      };
    }
    case 'TOGGLE_SIGN_MODAL': {
      const signAction = action as ToggleSignModalAction;
      if (signAction.show === false) {
        return {
          ...state,
          signMessageModalVisible: false,
        };
      }
      return {
        ...state,
        signMessageModalVisible: !state.signMessageModalVisible,
      };
    }
    default:
      return state;
  }
};
export default modalsReducer;
