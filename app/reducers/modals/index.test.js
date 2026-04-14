import modalsReducer from '.';

describe('Modals Reducer', () => {
  const initialState = {
    networkModalVisible: false,
    shouldNetworkSwitchPopToWallet: true,
    collectibleContractModalVisible: false,
    dappTransactionModalVisible: false,
    signMessageModalVisible: true,
  };

  it('should return initial state', () => {
    expect(modalsReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle TOGGLE_NETWORK_MODAL', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: false,
    });

    expect(result.networkModalVisible).toBe(true);
    expect(result.shouldNetworkSwitchPopToWallet).toBe(false);
  });

  it('should handle TOGGLE_COLLECTIBLE_CONTRACT_MODAL', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
    });

    expect(result.collectibleContractModalVisible).toBe(true);
  });

  it('should handle TOGGLE_DAPP_TRANSACTION_MODAL with show=false', () => {
    const state = { ...initialState, dappTransactionModalVisible: true };
    const result = modalsReducer(state, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: false,
    });

    expect(result.dappTransactionModalVisible).toBe(false);
  });

  it('should handle TOGGLE_DAPP_TRANSACTION_MODAL with show=null (toggle)', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: null,
    });

    expect(result.dappTransactionModalVisible).toBe(true);
  });

  it('should handle TOGGLE_INFO_NETWORK_MODAL with show=false', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_INFO_NETWORK_MODAL',
      show: false,
    });

    expect(result.infoNetworkModalVisible).toBe(false);
  });

  it('should handle TOGGLE_SIGN_MODAL with show=false', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
      show: false,
    });

    expect(result.signMessageModalVisible).toBe(false);
  });

  it('should handle TOGGLE_SIGN_MODAL toggle', () => {
    const result = modalsReducer(initialState, {
      type: 'TOGGLE_SIGN_MODAL',
      show: undefined,
    });

    expect(result.signMessageModalVisible).toBe(false);
  });

  it('should return state for unknown action', () => {
    expect(modalsReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
