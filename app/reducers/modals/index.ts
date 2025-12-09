import {
  type ModalsAction,
  ModalsActionType,
} from '../../actions/modals/types';
import { type ModalsState } from './types';

export * from './types';

/**
 * Initial modals state
 */
export const initialModalsState: ModalsState = {
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
  state: ModalsState = initialModalsState,
  action: ModalsAction,
): ModalsState => {
  switch (action.type) {
    case ModalsActionType.TOGGLE_NETWORK_MODAL:
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
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
            : action.show,
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
