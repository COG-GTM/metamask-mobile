import type { Action } from 'redux';
import {
  type ModalsAction,
  type ToggleNetworkModalAction,
  type ToggleDappTransactionModalAction,
  type ToggleInfoNetworkModalAction,
  type ToggleSignModalAction,
  TOGGLE_NETWORK_MODAL,
  TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
  TOGGLE_DAPP_TRANSACTION_MODAL,
  TOGGLE_INFO_NETWORK_MODAL,
  TOGGLE_SIGN_MODAL,
} from '../../actions/modals';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  infoNetworkModalVisible: boolean;
  signMessageModalVisible: boolean;
}

const initialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  infoNetworkModalVisible: false,
  signMessageModalVisible: true,
};

function modalsReducer(
  state: ModalsState = initialState,
  action: ModalsAction | Action = { type: '' },
): ModalsState {
  switch (action.type) {
    case TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: (action as ToggleNetworkModalAction)
          .shouldNetworkSwitchPopToWallet,
      };
    case TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case TOGGLE_DAPP_TRANSACTION_MODAL: {
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
    case TOGGLE_INFO_NETWORK_MODAL: {
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
    case TOGGLE_SIGN_MODAL: {
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
}

export default modalsReducer;
