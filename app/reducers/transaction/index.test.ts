import transactionReducer from './index';

describe('transactionReducer', () => {
  it('returns initial state', () => {
    const state = transactionReducer(undefined, { type: 'UNKNOWN' } as never);
    expect(state.selectedAsset).toEqual({});
    expect(state.useMax).toBe(false);
    expect(state.securityAlertResponses).toEqual({});
  });

  it('handles RESET_TRANSACTION', () => {
    const startState = transactionReducer(undefined, {
      type: 'SET_NONCE',
      nonce: 5,
    });
    expect(startState.nonce).toBe(5);
    const reset = transactionReducer(startState, { type: 'RESET_TRANSACTION' });
    expect(reset.nonce).toBeUndefined();
  });

  it('handles SET_NONCE and SET_PROPOSED_NONCE', () => {
    const stateA = transactionReducer(undefined, {
      type: 'SET_NONCE',
      nonce: 3,
    });
    const stateB = transactionReducer(stateA, {
      type: 'SET_PROPOSED_NONCE',
      proposedNonce: 7,
    });
    expect(stateB.nonce).toBe(3);
    expect(stateB.proposedNonce).toBe(7);
  });

  it('handles SET_SELECTED_ASSET and infers asset type', () => {
    const state = transactionReducer(undefined, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset: { isETH: true, symbol: 'ETH' },
    });
    expect(state.assetType).toBe('ETH');
  });
});
