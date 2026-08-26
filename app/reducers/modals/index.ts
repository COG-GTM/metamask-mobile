/* eslint-disable @typescript-eslint/default-param-last */
import type { Action } from '../../actions/modals';

export interface State {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

export const initialState: State = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

const modalsReducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_NETWORK_MODAL':
      return {
        ...state,
        networkModalVisible: !state.networkModalVisible,
        shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
      };
    case 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL':
      return {
        ...state,
        collectibleContractModalVisible: !state.collectibleContractModalVisible,
      };
    case 'TOGGLE_DAPP_TRANSACTION_MODAL':
      if ((action.show as boolean | null | undefined) === false) {
        return {
          ...state,
          dappTransactionModalVisible: false,
        };
      }
      return {
        ...state,
        dappTransactionModalVisible:
          (action.show as boolean | null | undefined) === null
            ? !state.dappTransactionModalVisible
            : (action.show as boolean),
      };
    case 'TOGGLE_INFO_NETWORK_MODAL':
      if ((action.show as boolean | null | undefined) === false) {
        return {
          ...state,
          infoNetworkModalVisible: false,
        };
      }
      return {
        ...state,
        infoNetworkModalVisible: !state.infoNetworkModalVisible,
      };
    case 'TOGGLE_SIGN_MODAL':
      if ((action.show as boolean | null | undefined) === false) {
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
