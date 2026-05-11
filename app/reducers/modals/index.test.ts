import modalsReducer from './index';

describe('modalsReducer', () => {
  it('returns initial state', () => {
    const state = modalsReducer(undefined, { type: 'UNKNOWN' } as never);
    expect(state).toEqual({
      networkModalVisible: false,
      shouldNetworkSwitchPopToWallet: true,
      collectibleContractModalVisible: false,
      dappTransactionModalVisible: false,
      signMessageModalVisible: true,
    });
  });

  it('toggles network modal', () => {
    const state = modalsReducer(undefined, {
      type: 'TOGGLE_NETWORK_MODAL',
      shouldNetworkSwitchPopToWallet: false,
    });
    expect(state.networkModalVisible).toBe(true);
    expect(state.shouldNetworkSwitchPopToWallet).toBe(false);
  });

  it('hides dapp transaction modal when show=false', () => {
    const state = modalsReducer(undefined, {
      type: 'TOGGLE_DAPP_TRANSACTION_MODAL',
      show: false,
    });
    expect(state.dappTransactionModalVisible).toBe(false);
  });
});
