import modalsReducer from './';

const initialState = {
  networkModalVisible: false,
  shouldNetworkSwitchPopToWallet: true,
  collectibleContractModalVisible: false,
  dappTransactionModalVisible: false,
  signMessageModalVisible: true,
};

describe('modalsReducer', () => {
  it('returns initial state', () => {
    const state = modalsReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles TOGGLE_NETWORK_MODAL', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: true,
    });
    expect(state.networkModalVisible).toBe(true);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(true);
  });

  it('handles TOGGLE_NETWORK_MODAL toggle back', () => {
    const visibleState = { ...initialState, networkModalVisible: true };
    const state = modalsReducer(visibleState, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: false,
    });
    expect(state.networkModalVisible).toBe(false);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(false);
  });

  it('handles TOGGLE_COLLECTIBLE_CONTRACT_MODAL', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
    });
    expect(state.collectibleContractModalVisible).toBe(true);
  });

  it('handles TOGGLE_DAPP_TRANSACTION_MODAL with show=false', () => {
    const visibleState = { ...initialState, dappTransactionModalVisible: true };
    const state = modalsReducer(visibleState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: false,
    });
    expect(state.dappTransactionModalVisible).toBe(false);
  });

  it('handles TOGGLE_DAPP_TRANSACTION_MODAL with show=null (toggle)', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: null,
    });
    expect(state.dappTransactionModalVisible).toBe(true);
  });

  it('handles TOGGLE_DAPP_TRANSACTION_MODAL with show=true', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: true,
    });
    expect(state.dappTransactionModalVisible).toBe(true);
  });

  it('handles TOGGLE_INFO_NETWORK_MODAL with show=false', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_INFO_NETWORK_MODAL',
      show: false,
    });
    expect(state.infoNetworkModalVisible).toBe(false);
  });

  it('handles TOGGLE_INFO_NETWORK_MODAL toggle', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_INFO_NETWORK_MODAL',
    });
    expect(state.infoNetworkModalVisible).toBe(true);
  });

  it('handles TOGGLE_SIGN_MODAL with show=false', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
      show: false,
    });
    expect(state.signMessageModalVisible).toBe(false);
  });

  it('handles TOGGLE_SIGN_MODAL toggle', () => {
    const state = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
    });
    // signMessageModalVisible starts as true, so toggle should make it false
    expect(state.signMessageModalVisible).toBe(false);
  });

  it('returns current state for unknown action', () => {
    const state = modalsReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});
