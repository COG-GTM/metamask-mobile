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
} from '.';

jest.mock('../../core/TransactionTypes', () => ({
  ASSET: { ETH: 'ETH', ERC20: 'ERC20', ERC721: 'ERC721' },
}));

describe('Transaction Actions', () => {
  it('resetTransaction should return correct action', () => {
    expect(resetTransaction()).toStrictEqual({ type: 'RESET_TRANSACTION' });
  });

  it('newAssetTransaction should return ETH type for ETH asset', () => {
    const result = newAssetTransaction({ isETH: true, symbol: 'ETH' });

    expect(result.type).toBe('NEW_ASSET_TRANSACTION');
    expect(result.assetType).toBe('ETH');
  });

  it('newAssetTransaction should return ERC721 type for NFT', () => {
    const result = newAssetTransaction({ tokenId: '1', address: '0x1' });

    expect(result.type).toBe('NEW_ASSET_TRANSACTION');
    expect(result.assetType).toBe('ERC721');
  });

  it('newAssetTransaction should return ERC20 type for token', () => {
    const result = newAssetTransaction({ symbol: 'DAI', address: '0x1' });

    expect(result.type).toBe('NEW_ASSET_TRANSACTION');
    expect(result.assetType).toBe('ERC20');
  });

  it('setRecipient should return correct action', () => {
    expect(setRecipient('0xFrom', '0xTo', 'ens.eth', 'To Name', 'From Name')).toStrictEqual({
      type: 'SET_RECIPIENT',
      from: '0xFrom',
      to: '0xTo',
      ensRecipient: 'ens.eth',
      transactionToName: 'To Name',
      transactionFromName: 'From Name',
    });
  });

  it('setSelectedAsset should return correct action for ETH', () => {
    const result = setSelectedAsset({ isETH: true });

    expect(result.type).toBe('SET_SELECTED_ASSET');
    expect(result.assetType).toBe('ETH');
  });

  it('prepareTransaction should return correct action', () => {
    const tx = { from: '0x1', to: '0x2', value: '0x0' };

    expect(prepareTransaction(tx)).toStrictEqual({
      type: 'PREPARE_TRANSACTION',
      transaction: tx,
    });
  });

  it('setTransactionSecurityAlertResponse should return correct action', () => {
    expect(setTransactionSecurityAlertResponse('tx-1', { result: 'safe' })).toStrictEqual({
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'tx-1',
      securityAlertResponse: { result: 'safe' },
    });
  });

  it('setTransactionObject should return correct action', () => {
    const tx = { from: '0x1', to: '0x2' };

    expect(setTransactionObject(tx)).toStrictEqual({
      type: 'SET_TRANSACTION_OBJECT',
      transaction: tx,
    });
  });

  it('setTransactionId should return correct action', () => {
    expect(setTransactionId('tx-123')).toStrictEqual({
      type: 'SET_TRANSACTION_ID',
      transactionId: 'tx-123',
    });
  });

  it('setTokensTransaction should return correct action', () => {
    const asset = { symbol: 'DAI' };

    expect(setTokensTransaction(asset)).toStrictEqual({
      type: 'SET_TOKENS_TRANSACTION',
      asset,
    });
  });

  it('setEtherTransaction should return correct action', () => {
    const tx = { value: '1000000000000000000' };

    expect(setEtherTransaction(tx)).toStrictEqual({
      type: 'SET_ETHER_TRANSACTION',
      transaction: tx,
    });
  });

  it('setNonce should return correct action', () => {
    expect(setNonce(42)).toStrictEqual({ type: 'SET_NONCE', nonce: 42 });
  });

  it('setProposedNonce should return correct action', () => {
    expect(setProposedNonce(43)).toStrictEqual({ type: 'SET_PROPOSED_NONCE', proposedNonce: 43 });
  });

  it('setMaxValueMode should return correct action', () => {
    expect(setMaxValueMode(true)).toStrictEqual({ type: 'SET_MAX_VALUE_MODE', maxValueMode: true });
  });

  it('setTransactionValue should return correct action', () => {
    expect(setTransactionValue('0x1')).toStrictEqual({ type: 'SET_TRANSACTION_VALUE', value: '0x1' });
  });
});
