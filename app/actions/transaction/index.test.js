import {
  resetTransaction,
  newAssetTransaction,
  setRecipient,
  setSelectedAsset,
  prepareTransaction,
  setTransactionSecurityAlertResponse,
  setTransactionObject,
  setTransactionId,
  setTokensTransaction,
  setEtherTransaction,
  setNonce,
  setProposedNonce,
  setMaxValueMode,
  setTransactionValue,
} from './index';

jest.mock('../../core/TransactionTypes', () => ({
  ASSET: { ETH: 'ETH', ERC20: 'ERC20', ERC721: 'ERC721' },
}));

describe('transaction actions', () => {
  it('resetTransaction creates correct action', () => {
    expect(resetTransaction()).toEqual({ type: 'RESET_TRANSACTION' });
  });

  it('newAssetTransaction with ETH asset', () => {
    const asset = { isETH: true, symbol: 'ETH' };
    const action = newAssetTransaction(asset);
    expect(action.type).toBe('NEW_ASSET_TRANSACTION');
    expect(action.selectedAsset).toEqual(asset);
    expect(action.assetType).toBe('ETH');
  });

  it('newAssetTransaction with ERC721 asset', () => {
    const asset = { tokenId: '1', address: '0x123' };
    const action = newAssetTransaction(asset);
    expect(action.assetType).toBe('ERC721');
  });

  it('newAssetTransaction with ERC20 asset', () => {
    const asset = { symbol: 'DAI', address: '0x123' };
    const action = newAssetTransaction(asset);
    expect(action.assetType).toBe('ERC20');
  });

  it('setRecipient creates correct action', () => {
    const action = setRecipient('0xfrom', '0xto', 'test.eth', 'Alice', 'Bob');
    expect(action).toEqual({
      type: 'SET_RECIPIENT',
      from: '0xfrom',
      to: '0xto',
      ensRecipient: 'test.eth',
      transactionToName: 'Alice',
      transactionFromName: 'Bob',
    });
  });

  it('setSelectedAsset with ETH', () => {
    const asset = { isETH: true };
    const action = setSelectedAsset(asset);
    expect(action.type).toBe('SET_SELECTED_ASSET');
    expect(action.assetType).toBe('ETH');
  });

  it('setSelectedAsset with ERC721', () => {
    const asset = { tokenId: '5' };
    const action = setSelectedAsset(asset);
    expect(action.assetType).toBe('ERC721');
  });

  it('setSelectedAsset with ERC20', () => {
    const asset = { symbol: 'USDC' };
    const action = setSelectedAsset(asset);
    expect(action.assetType).toBe('ERC20');
  });

  it('prepareTransaction creates correct action', () => {
    const tx = { from: '0x1', to: '0x2', value: '0x100' };
    expect(prepareTransaction(tx)).toEqual({
      type: 'PREPARE_TRANSACTION',
      transaction: tx,
    });
  });

  it('setTransactionSecurityAlertResponse creates correct action', () => {
    expect(setTransactionSecurityAlertResponse('tx1', { result: 'safe' })).toEqual({
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx1',
      securityAlertResponse: { result: 'safe' },
    });
  });

  it('setTransactionObject creates correct action', () => {
    const tx = { from: '0x1' };
    expect(setTransactionObject(tx)).toEqual({
      type: 'SET_TRANSACTION_OBJECT',
      transaction: tx,
    });
  });

  it('setTransactionId creates correct action', () => {
    expect(setTransactionId('tx-abc')).toEqual({
      type: 'SET_TRANSACTION_ID',
      transactionId: 'tx-abc',
    });
  });

  it('setTokensTransaction creates correct action', () => {
    const asset = { symbol: 'DAI' };
    expect(setTokensTransaction(asset)).toEqual({
      type: 'SET_TOKENS_TRANSACTION',
      asset,
    });
  });

  it('setEtherTransaction creates correct action', () => {
    const tx = { value: '0x1' };
    expect(setEtherTransaction(tx)).toEqual({
      type: 'SET_ETHER_TRANSACTION',
      transaction: tx,
    });
  });

  it('setNonce creates correct action', () => {
    expect(setNonce('42')).toEqual({ type: 'SET_NONCE', nonce: '42' });
  });

  it('setProposedNonce creates correct action', () => {
    expect(setProposedNonce('10')).toEqual({ type: 'SET_PROPOSED_NONCE', proposedNonce: '10' });
  });

  it('setMaxValueMode creates correct action', () => {
    expect(setMaxValueMode(true)).toEqual({ type: 'SET_MAX_VALUE_MODE', maxValueMode: true });
  });

  it('setTransactionValue creates correct action', () => {
    expect(setTransactionValue('0x100')).toEqual({ type: 'SET_TRANSACTION_VALUE', value: '0x100' });
  });
});
