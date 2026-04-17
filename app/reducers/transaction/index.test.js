import { REHYDRATE } from 'redux-persist';
import transactionReducer from './index';

jest.mock('../../core/TransactionTypes', () => ({
  ASSET: { ETH: 'ETH', ERC20: 'ERC20', ERC721: 'ERC721' },
}));

jest.mock('../../util/transaction-reducer-helpers', () => ({
  getTxData: (tx) => {
    const { selectedAsset, assetType, ...data } = tx;
    return data;
  },
  getTxMeta: (tx) => {
    const meta = {};
    if (tx.transactionTo !== undefined) meta.transactionTo = tx.transactionTo;
    if (tx.transactionToName !== undefined) meta.transactionToName = tx.transactionToName;
    if (tx.transactionFromName !== undefined) meta.transactionFromName = tx.transactionFromName;
    if (tx.symbol !== undefined) meta.symbol = tx.symbol;
    if (tx.readableValue !== undefined) meta.readableValue = tx.readableValue;
    return meta;
  },
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
  it('should return initial state', () => {
    const state = transactionReducer(undefined, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  it('should handle REHYDRATE', () => {
    const modifiedState = { ...initialState, nonce: '5' };
    const state = transactionReducer(modifiedState, { type: REHYDRATE });
    expect(state).toEqual(initialState);
  });

  it('should handle RESET_TRANSACTION', () => {
    const modifiedState = { ...initialState, nonce: '5', id: 'test-id' };
    const state = transactionReducer(modifiedState, { type: 'RESET_TRANSACTION' });
    expect(state).toEqual(initialState);
  });

  it('should handle NEW_ASSET_TRANSACTION', () => {
    const selectedAsset = { symbol: 'DAI', address: '0x123' };
    const state = transactionReducer(initialState, {
      type: 'NEW_ASSET_TRANSACTION',
      selectedAsset,
      assetType: 'ERC20',
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
    expect(state.assetType).toBe('ERC20');
  });

  it('should handle SET_NONCE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_NONCE',
      nonce: '42',
    });
    expect(state.nonce).toBe('42');
  });

  it('should handle SET_PROPOSED_NONCE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_PROPOSED_NONCE',
      proposedNonce: '10',
    });
    expect(state.proposedNonce).toBe('10');
  });

  it('should handle SET_RECIPIENT', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_RECIPIENT',
      from: '0xabc',
      to: '0xdef',
      ensRecipient: 'test.eth',
      transactionToName: 'Alice',
      transactionFromName: 'Bob',
    });
    expect(state.transaction.from).toBe('0xabc');
    expect(state.ensRecipient).toBe('test.eth');
    expect(state.transactionTo).toBe('0xdef');
    expect(state.transactionToName).toBe('Alice');
    expect(state.transactionFromName).toBe('Bob');
  });

  it('should handle SET_SELECTED_ASSET with ERC721', () => {
    const selectedAsset = { tokenId: '1', address: '0x123' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
  });

  it('should handle SET_SELECTED_ASSET with ETH', () => {
    const selectedAsset = { isETH: true, symbol: 'ETH' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
  });

  it('should handle SET_SELECTED_ASSET with ERC20', () => {
    const selectedAsset = { symbol: 'DAI', address: '0x456' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
    });
    expect(state.selectedAsset).toEqual(selectedAsset);
  });

  it('should handle SET_SELECTED_ASSET with explicit assetType', () => {
    const selectedAsset = { symbol: 'DAI', address: '0x456' };
    const state = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset,
      assetType: 'ERC20',
    });
    expect(state.assetType).toBe('ERC20');
  });

  it('should handle PREPARE_TRANSACTION', () => {
    const transaction = { from: '0xabc', to: '0xdef', value: '0x1' };
    const state = transactionReducer(initialState, {
      type: 'PREPARE_TRANSACTION',
      transaction,
    });
    expect(state.transaction).toEqual(transaction);
  });

  it('should handle SET_TRANSACTION_OBJECT', () => {
    const transaction = { from: '0xabc', to: '0xdef', value: '0x1' };
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction,
    });
    expect(state.transaction.from).toBe('0xabc');
  });

  it('should handle SET_TRANSACTION_OBJECT with selectedAsset', () => {
    const transaction = {
      from: '0xabc',
      selectedAsset: { isETH: true },
    };
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction,
    });
    expect(state.transaction.from).toBe('0xabc');
  });

  it('should handle SET_TOKENS_TRANSACTION', () => {
    const asset = { symbol: 'USDC', address: '0x789' };
    const state = transactionReducer(initialState, {
      type: 'SET_TOKENS_TRANSACTION',
      asset,
    });
    expect(state.selectedAsset).toEqual(asset);
  });

  it('should handle SET_ETHER_TRANSACTION', () => {
    const transaction = { transactionTo: '0xdef', readableValue: '1.0' };
    const state = transactionReducer(initialState, {
      type: 'SET_ETHER_TRANSACTION',
      transaction,
    });
    expect(state.symbol).toBe('ETH');
    expect(state.assetType).toBe('ETH');
    expect(state.selectedAsset).toEqual({ isETH: true, symbol: 'ETH' });
  });

  it('should handle SET_TRANSACTION_SECURITY_ALERT_RESPONSE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx1',
      securityAlertResponse: { result_type: 'Malicious' },
    });
    expect(state.securityAlertResponses.tx1).toEqual({ result_type: 'Malicious' });
  });

  it('should handle SET_TRANSACTION_ID', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_ID',
      transactionId: 'tx-123',
    });
    expect(state.id).toBe('tx-123');
  });

  it('should handle SET_MAX_VALUE_MODE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_MAX_VALUE_MODE',
      maxValueMode: true,
    });
    expect(state.maxValueMode).toBe(true);
  });

  it('should handle SET_TRANSACTION_VALUE', () => {
    const state = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_VALUE',
      value: '0x100',
    });
    expect(state.transaction.value).toBe('0x100');
  });

  it('should return same state for unknown action', () => {
    const state = transactionReducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(initialState);
  });

  it('should preserve securityAlertResponses when SET_TRANSACTION_OBJECT is dispatched', () => {
    const stateWithAlert = {
      ...initialState,
      securityAlertResponses: { tx1: { result_type: 'Safe' } },
    };
    const state = transactionReducer(stateWithAlert, {
      type: 'SET_TRANSACTION_OBJECT',
      transaction: { from: '0xnew' },
    });
    expect(state.securityAlertResponses).toEqual({ tx1: { result_type: 'Safe' } });
  });
});
