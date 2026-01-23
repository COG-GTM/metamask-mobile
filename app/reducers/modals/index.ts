import { ModalActionTypes, ModalAction } from '../../actions/modals';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

export const modalsInitialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

/* eslint-disable @typescript-eslint/default-param-last */
const modalsReducer = (
  state: ModalsState = modalsInitialState,
  action: ModalAction,
): ModalsState => {
  switch (action.type) {
    case ModalActionTypes.TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
      };
    case ModalActionTypes.TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case ModalActionTypes.TOGGLE_DAPP_TRANSACTION_MODAL:
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
            : action.show,
      };
    case ModalActionTypes.TOGGLE_INFO_NETWORK_MODAL:
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
    case ModalActionTypes.TOGGLE_SIGN_MODAL:
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
