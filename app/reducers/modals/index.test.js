import modalsReducer from './';

describe('modalsReducer', () => {
  const initialState = {
    networkModalVisible: false,
    shouldNetworkSwitchPopToWallet: true,
    collectibleContractModalVisible: false,
    dappTransactionModalVisible: false,
    signMessageModalVisible: true,
  };

  it('should return initial state', () => {
    expect(modalsReducer(undefined, { type: 'UNKNOWN' })).toEqual(initialState);
  });

  describe('TOGGLE_NETWORK_MODAL', () => {
    it('should toggle networkModalVisible from false to true', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_NETWORK_MODAL',
        shouldNetworkSwitchPopToWallet: false,
      });
      expect(result.networkModalVisible).toBe(true);
      expect(result.shouldNetworkSwitchPopToWallet).toBe(false);
    });

    it('should toggle networkModalVisible from true to false', () => {
      const state = { ...initialState, networkModalVisible: true };
      const result = modalsReducer(state, {
        type: 'TOGGLE_NETWORK_MODAL',
        shouldNetworkSwitchPopToWallet: true,
      });
      expect(result.networkModalVisible).toBe(false);
    });
  });

  describe('TOGGLE_COLLECTIBLE_CONTRACT_MODAL', () => {
    it('should toggle collectibleContractModalVisible', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
      });
      expect(result.collectibleContractModalVisible).toBe(true);
    });

    it('should toggle back to false', () => {
      const state = { ...initialState, collectibleContractModalVisible: true };
      const result = modalsReducer(state, {
        type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL',
      });
      expect(result.collectibleContractModalVisible).toBe(false);
    });
  });

  describe('TOGGLE_DAPP_TRANSACTION_MODAL', () => {
    it('should set to false when show is false', () => {
      const state = { ...initialState, dappTransactionModalVisible: true };
      const result = modalsReducer(state, {
        type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
        show: false,
      });
      expect(result.dappTransactionModalVisible).toBe(false);
    });

    it('should toggle when show is null', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
        show: null,
      });
      expect(result.dappTransactionModalVisible).toBe(true);
    });

    it('should set to action.show value when show is truthy', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
        show: true,
      });
      expect(result.dappTransactionModalVisible).toBe(true);
    });
  });

  describe('TOGGLE_INFO_NETWORK_MODAL', () => {
    it('should set to false when show is false', () => {
      const state = { ...initialState, infoNetworkModalVisible: true };
      const result = modalsReducer(state, {
        type: 'TOGGLE_INFO_NETWORK_MODAL',
        show: false,
      });
      expect(result.infoNetworkModalVisible).toBe(false);
    });

    it('should toggle when show is undefined', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_INFO_NETWORK_MODAL',
      });
      expect(result.infoNetworkModalVisible).toBe(true);
    });
  });

  describe('TOGGLE_SIGN_MODAL', () => {
    it('should set to false when show is false', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_SIGN_MODAL',
        show: false,
      });
      expect(result.signMessageModalVisible).toBe(false);
    });

    it('should toggle when show is undefined', () => {
      const result = modalsReducer(initialState, {
        type: 'TOGGLE_SIGN_MODAL',
      });
      expect(result.signMessageModalVisible).toBe(false);
    });
  });

  it('should return state unchanged for unknown action', () => {
    expect(modalsReducer(initialState, { type: 'UNKNOWN' })).toBe(initialState);
  });
});
