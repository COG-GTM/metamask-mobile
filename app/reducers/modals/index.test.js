import modalsReducer from './index';

const initialState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

describe('modalsReducer', () => {
  it('should return initial state', () => {
    const state = modalsReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  it('should handle TOGGLE_NETWORK_MODAL', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: false,
    });
    expect(state.networkModalVisible).toBe(true);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(false);
  });

  it('should toggle TOGGLE_NETWORK_MODAL back to false', () => {
    const openState = { ...initialState, networkModalVisible: true };
    const state = modalsReducer(openState, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: true,
    });
    expect(state.networkModalVisible).toBe(false);
  });

  it('should handle TOGGLE_COLLECTIBLE_CONTRACT_MODAL', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
    });
    expect(state.collectibleContractModalVisible).toBe(true);
  });

  it('should toggle TOGGLE_COLLECTIBLE_CONTRACT_MODAL back', () => {
    const openState = { ...initialState, collectibleContractModalVisible: true };
    const state = modalsReducer(openState, {
      type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
    });
    expect(state.collectibleContractModalVisible).toBe(false);
  });

  it('should handle TOGGLE_DAPP_TRANSACTION_MODAL with show=false', () => {
    const openState = { ...initialState, dappTransactionModalVisible: true };
    const state = modalsReducer(openState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: false,
    });
    expect(state.dappTransactionModalVisible).toBe(false);
  });

  it('should handle TOGGLE_DAPP_TRANSACTION_MODAL with show=null (toggle)', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: null,
    });
    expect(state.dappTransactionModalVisible).toBe(true);
  });

  it('should handle TOGGLE_DAPP_TRANSACTION_MODAL with show=true', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: true,
    });
    expect(state.dappTransactionModalVisible).toBe(true);
  });

  it('should handle TOGGLE_INFO_NETWORK_MODAL with show=false', () => {
    const openState = { ...initialState, infoNetworkModalVisible: true };
    const state = modalsReducer(openState, {
      type: 'TOGGLE_INFO_NETWORK_MODAL',
      show: false,
    });
    expect(state.infoNetworkModalVisible).toBe(false);
  });

  it('should handle TOGGLE_INFO_NETWORK_MODAL toggle', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_INFO_NETWORK_MODAL',
    });
    expect(state.infoNetworkModalVisible).toBe(true);
  });

  it('should handle TOGGLE_SIGN_MODAL with show=false', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
      show: false,
    });
    expect(state.signMessageModalVisible).toBe(false);
  });

  it('should handle TOGGLE_SIGN_MODAL toggle', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
    });
    expect(state.signMessageModalVisible).toBe(false);
  });

  it('should return current state for unknown action', () => {
    const state = modalsReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });
});
