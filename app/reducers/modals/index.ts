import { ModalActionType, ModalAction } from '../../actions/modals';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean | null | undefined;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

const initialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

const modalsReducer = (
  state: ModalsState = initialState,
  action: ModalAction,
): ModalsState => {
  switch (action.type) {
    case ModalActionType.TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
      };
    case ModalActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case ModalActionType.TOGGLE_DAPP_TRANSACTION_MODAL:
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
    case ModalActionType.TOGGLE_INFO_NETWORK_MODAL:
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
    case ModalActionType.TOGGLE_SIGN_MODAL:
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
