import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type ToggleDappTransactionModalAction,
  type ToggleInfoNetworkModalAction,
  type ToggleNetworkModalAction,
  type ToggleSignModalAction,
} from '../../actions/modals';

export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean | undefined;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

export const initialState: ModalsState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

const slice = createSlice({
  name: 'modals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.TOGGLE_NETWORK_MODAL,
        (state, action: ToggleNetworkModalAction): ModalsState => ({
          ...state,
          networkModalVisible: !state.networkModalVisible,
          shouldNetworkSwitchPopToWallet: action.shouldNetworkSwitchPopToWallet,
        }),
      )
      .addCase(
        ActionType.TOGGLE_COLLECTIBLE_CONTRACT_MODAL,
        (state): ModalsState => ({
          ...state,
          collectibleContractModalVisible:
            !state.collectibleContractModalVisible,
        }),
      )
      .addCase(
        ActionType.TOGGLE_DAPP_TRANSACTION_MODAL,
        (state, action: ToggleDappTransactionModalAction): ModalsState => {
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
        },
      )
      .addCase(
        ActionType.TOGGLE_INFO_NETWORK_MODAL,
        (state, action: ToggleInfoNetworkModalAction): ModalsState => {
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
        },
      )
      .addCase(
        ActionType.TOGGLE_SIGN_MODAL,
        (state, action: ToggleSignModalAction): ModalsState => {
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
        },
      );
  },
});

const modalsReducer = slice.reducer;

export default modalsReducer;
