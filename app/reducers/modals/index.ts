/* eslint-disable @typescript-eslint/default-param-last */
import { ActionType, ModalsAction } from '../../actions/modals';
import { ModalsState } from '../../actions/modals/state';

export type { ModalsState } from '../../actions/modals/state';

export const initialState: Readonly<ModalsState> = {
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
    case ActionType.TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
      };
    case ActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL:
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case ActionType.TOGGLE_DAPP_TRANSACTION_MODAL:
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
            : action.show ?? !state.dappTransactionModalVisible,
      };
    case ActionType.TOGGLE_INFO_NETWORK_MODAL:
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
    case ActionType.TOGGLE_SIGN_MODAL:
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
