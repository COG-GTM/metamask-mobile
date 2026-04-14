import transactionReducer from '.';

jest.mock('../../util/transaction-reducer-helpers', () => ({
  getTxData: (tx) => ({
    data: tx.data,
    from: tx.from,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    to: tx.to,
    value: tx.value,
  }),
  getTxMeta: (tx) => ({
    symbol: tx.symbol,
    readableValue: tx.readableValue,
    type: tx.type,
    id: tx.id,
  }),
}));

describe('Transaction Reducer', () => {
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

  it('should return initial state', () => {
    expect(transactionReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle RESET_TRANSACTION', () => {
    const modifiedState = { ...initialState, nonce: 5 };
    const result = transactionReducer(modifiedState, { type: 'RESET_TRANSACTION' });

    expect(result).toStrictEqual(initialState);
  });

  it('should handle NEW_ASSET_TRANSACTION', () => {
    const result = transactionReducer(initialState, {
      type: 'NEW_ASSET_TRANSACTION',
      selectedAsset: { isETH: true },
      assetType: 'ETH',
    });

    expect(result.selectedAsset).toStrictEqual({ isETH: true });
    expect(result.assetType).toBe('ETH');
  });

  it('should handle SET_NONCE', () => {
    const result = transactionReducer(initialState, { type: 'SET_NONCE', nonce: 42 });

    expect(result.nonce).toBe(42);
  });

  it('should handle SET_PROPOSED_NONCE', () => {
    const result = transactionReducer(initialState, { type: 'SET_PROPOSED_NONCE', proposedNonce: 43 });

    expect(result.proposedNonce).toBe(43);
  });

  it('should handle SET_RECIPIENT', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_RECIPIENT',
      from: '0xFrom',
      to: '0xTo',
      ensRecipient: 'test.eth',
      transactionToName: 'To',
      transactionFromName: 'From',
    });

    expect(result.transactionTo).toBe('0xTo');
    expect(result.ensRecipient).toBe('test.eth');
    expect(result.transaction.from).toBe('0xFrom');
  });

  it('should handle SET_SELECTED_ASSET', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_SELECTED_ASSET',
      selectedAsset: { tokenId: '1' },
      assetType: 'ERC721',
    });

    expect(result.selectedAsset).toStrictEqual({ tokenId: '1' });
    expect(result.assetType).toBe('ERC721');
  });

  it('should handle PREPARE_TRANSACTION', () => {
    const tx = { from: '0x1', to: '0x2', value: '0x0' };
    const result = transactionReducer(initialState, {
      type: 'PREPARE_TRANSACTION',
      transaction: tx,
    });

    expect(result.transaction).toStrictEqual(tx);
  });

  it('should handle SET_TRANSACTION_SECURITY_ALERT_RESPONSE', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx-1',
      securityAlertResponse: { result: 'safe' },
    });

    expect(result.securityAlertResponses['tx-1']).toStrictEqual({ result: 'safe' });
  });

  it('should handle SET_TRANSACTION_ID', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_ID',
      transactionId: 'tx-123',
    });

    expect(result.id).toBe('tx-123');
  });

  it('should handle SET_MAX_VALUE_MODE', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_MAX_VALUE_MODE',
      maxValueMode: true,
    });

    expect(result.maxValueMode).toBe(true);
  });

  it('should handle SET_TRANSACTION_VALUE', () => {
    const result = transactionReducer(initialState, {
      type: 'SET_TRANSACTION_VALUE',
      value: '0x1',
    });

    expect(result.transaction.value).toBe('0x1');
  });

  it('should return state for unknown action', () => {
    expect(transactionReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
