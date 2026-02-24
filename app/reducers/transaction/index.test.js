import transactionReducer from './';

import { REHYDRATE } from 'redux-persist';

jest.mock('../../util/transaction-reducer-helpers', () => ({
  getTxData: jest.fn((tx) => {
    const { data, from, gas, gasPrice, to, value, maxFeePerGas, maxPriorityFeePerGas } = tx || {};
    const result = {};
    if (data !== undefined) result.data = data;
    if (from !== undefined) result.from = from;
    if (gas !== undefined) result.gas = gas;
    if (gasPrice !== undefined) result.gasPrice = gasPrice;
    if (to !== undefined) result.to = to;
    if (value !== undefined) result.value = value;
    if (maxFeePerGas !== undefined) result.maxFeePerGas = maxFeePerGas;
    if (maxPriorityFeePerGas !== undefined) result.maxPriorityFeePerGas = maxPriorityFeePerGas;
    return result;
  }),
  getTxMeta: jest.fn((tx) => {
    const { data, from, gas, gasPrice, to, value, maxFeePerGas, maxPriorityFeePerGas, ...rest } = tx || {};
    const result = {};
    for (const [key, val] of Object.entries(rest)) {
      if (val !== undefined) result[key] = val;
    }
    return result;
  }),
}));

const initialState = {
  ensRecipient: undefined,
  assetType: undefined,
  selectedAsset: {},
  transaction: {
    data: undefined,
    from: undefined,
    gas: undefined,
    gasPrice: undefined,
    to: undefined,
    value: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  },
  warningGasPriceHigh: undefined,
  transactionTo: undefined,
  transactionToName: undefined,
  transactionFromName: undefined,
  transactionValue: undefined,
  symbol: undefined,
  paymentRequest: undefined,
  readableValue: undefined,
  id: undefined,
  type: undefined,
  proposedNonce: undefined,
  nonce: undefined,
  securityAlertResponses: {},
  useMax: false,
};

describe('transactionReducer', () => {
  it('returns initial state', () => {
    const state = transactionReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles REHYDRATE', () => {
    const modifiedState = { ...initialState, nonce: 5 };
    const state = transactionReducer(modifiedState, { type: REHYDRATE });
    expect(state).toEqual(initialState);
  });

  it('handles RESET_TRANSACTION', () => {
    const modifiedState = { ...initialState, nonce: 10, assetType: 'ETH' };
    const state = transactionReducer(modifiedState, { type: 'RESET_TRANSACTION' });
    expect(state).toEqual(initialState);
  });

  it('handles NEW_ASSET_TRANSACTION', () => {
    const selectedAsset = { isETH: true, symbol: 'ETH' };
    const state = transactionReducer(initialState, {
      type: 'NEW_ASSET_TRANSACTION',
      selectedAsset,
      assetType: 'ETH',
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
    expect(state.assetType).toBe('ETH');
  });

  it('handles SET_NONCE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_NONCE',
      nonce: 42,
    });
    expect(state.nonce).toBe(42);
  });

  it('handles SET_PROPOSED_NONCE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_PROPOSED_NONCE',
      proposedNonce: 7,
    });
    expect(state.proposedNonce).toBe(7);
  });

  it('handles SET_RECIPIENT', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_RECIPIENT',
      from: '0xfrom',
      to: '0xto',
      ensRecipient: 'test.eth',
      transactionToName: 'Alice',
      transactionFromName: 'Bob',
    });
    expect(state.transaction.from).toBe('0xfrom');
    expect(state.ensRecipient).toBe('test.eth');
    expect(state.transactionTo).toBe('0xto');
    expect(state.transactionToName).toBe('Alice');
    expect(state.transactionFromName).toBe('Bob');
  });

  it('handles SET_SELECTED_ASSET with assetType from action', () => {
    const selectedAsset = { symbol: 'DAI', address: '0xdai' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
      assetType: 'ERC20',
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
    expect(state.assetType).toBe('ERC20');
  });

  it('handles SET_SELECTED_ASSET infers ERC721 for NFTs', () => {
    const selectedAsset = { tokenId: '123' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
    expect(state.assetType).toBe('ERC721');
  });

  it('handles SET_SELECTED_ASSET infers ETH for isETH', () => {
    const selectedAsset = { isETH: true };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
    });
    expect(state.assetType).toBe('ETH');
  });

  it('handles PREPARE_TRANSACTION', () => {
    const transaction = { from: '0x1', to: '0x2', value: '0x100' };
    const state = transactionReducer(initialState, {
      type: 'PREPARE_TRANSACTION',
      transaction,
    });
    expect(state.transaction).toEqual(transaction);
  });

  it('handles SET_TRANSACTION_OBJECT', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction: { from: '0x1', to: '0x2', value: '0x100' },
    });
    expect(state.transaction.from).toBe('0x1');
    expect(state.transaction.to).toBe('0x2');
    expect(state.transaction.value).toBe('0x100');
  });

  it('handles SET_TRANSACTION_OBJECT with selectedAsset', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction: {
        from: '0x1',
        selectedAsset: { isETH: true },
      },
    });
    expect(state.transaction.from).toBe('0x1');
  });

  it('handles SET_TRANSACTION_OBJECT with NFT selectedAsset', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction: {
        from: '0x1',
        selectedAsset: { tokenId: '5' },
      },
    });
    expect(state.transaction.from).toBe('0x1');
  });

  it('handles SET_TRANSACTION_OBJECT preserves securityAlertResponses', () => {
    const stateWithAlerts = {
      ...initialState,
      securityAlertResponses: { tx1: { result_type: 'Malicious' } },
    };
    const state = transactionReducer(stateWithAlerts, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction: { from: '0x1' },
    });
    expect(state.securityAlertResponses).toEqual({ tx1: { result_type: 'Malicious' } });
  });

  it('handles SET_TOKENS_TRANSACTION with ERC20 token', () => {
    const asset = { address: '0xdai', symbol: 'DAI' };
    const state = transactionReducer(initialState, {
      type: 'SET_TOKENS_TRANSACTION',
      asset,
    });
    expect(state.selectedAsset).toEqual(asset);
    expect(state.assetType).toBe('ERC20');
  });

  it('handles SET_TOKENS_TRANSACTION with ETH', () => {
    const asset = { isETH: true, symbol: 'ETH' };
    const state = transactionReducer(initialState, {
      type: 'SET_TOKENS_TRANSACTION',
      asset,
    });
    expect(state.selectedAsset).toEqual(asset);
    expect(state.assetType).toBe('ETH');
  });

  it('handles SET_ETHER_TRANSACTION', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_ETHER_TRANSACTION',
      transaction: { from: '0x1', to: '0x2', value: '0x100' },
    });
    expect(state.symbol).toBe('ETH');
    expect(state.assetType).toBe('ETH');
    expect(state.selectedAsset).toEqual({ isETH: true, symbol: 'ETH' });
    expect(state.transaction.from).toBe('0x1');
    expect(state.transaction.to).toBe('0x2');
    expect(state.transaction.value).toBe('0x100');
  });

  it('handles SET_TRANSACTION_SECURITY_ALERT_RESPONSE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx1',
      securityAlertResponse: { result_type: 'Benign' },
    });
    expect(state.securityAlertResponses).toEqual({
      tx1: { result_type: 'Benign' },
    });
  });

  it('handles SET_TRANSACTION_SECURITY_ALERT_RESPONSE accumulates responses', () => {
    const stateWithAlert = {
      ...initialState,
      securityAlertResponses: { tx1: { result_type: 'Benign' } },
    };
    const state = transactionReducer(stateWithAlert, {
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx2',
      securityAlertResponse: { result_type: 'Malicious' },
    });
    expect(state.securityAlertResponses).toEqual({
      tx1: { result_type: 'Benign' },
      tx2: { result_type: 'Malicious' },
    });
  });

  it('handles SET_TRANSACTION_ID', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_ID',
      transactionId: 'abc-123',
    });
    expect(state.id).toBe('abc-123');
  });

  it('handles SET_MAX_VALUE_MODE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_MAX_VALUE_MODE',
      maxValueMode: true,
    });
    expect(state.maxValueMode).toBe(true);
  });

  it('handles SET_TRANSACTION_VALUE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_VALUE',
      value: '0xabc',
    });
    expect(state.transaction.value).toBe('0xabc');
  });

  it('returns current state for unknown action', () => {
    const state = transactionReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});
