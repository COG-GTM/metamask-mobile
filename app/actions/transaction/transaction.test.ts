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

describe('transaction actions', () => {
  it('resetTransaction', () => {
    expect(resetTransaction()).toEqual({ type: 'RESET_TRANSACTION' });
  });

  describe('newAssetTransaction', () => {
    it('sets ETH asset type', () => {
      expect(newAssetTransaction({ isETH: true })).toEqual({
        type: 'NEW_ASSET_TRANSACTION',
        selectedAsset: { isETH: true },
        assetType: 'ETH',
      });
    });

    it('sets ERC721 asset type', () => {
      expect(newAssetTransaction({ tokenId: '1' }).assetType).toBe('ERC721');
    });

    it('defaults to ERC20 asset type', () => {
      expect(newAssetTransaction({ address: '0x1' }).assetType).toBe('ERC20');
    });
  });

  describe('setSelectedAsset', () => {
    it('sets ETH asset type', () => {
      expect(setSelectedAsset({ isETH: true })).toEqual({
        type: 'SET_SELECTED_ASSET',
        selectedAsset: { isETH: true },
        assetType: 'ETH',
      });
    });

    it('sets ERC721 asset type', () => {
      expect(setSelectedAsset({ tokenId: '1' }).assetType).toBe('ERC721');
    });

    it('defaults to ERC20 asset type', () => {
      expect(setSelectedAsset({ address: '0x1' }).assetType).toBe('ERC20');
    });
  });

  it('setRecipient', () => {
    expect(setRecipient('a', 'b', 'c', 'd', 'e')).toEqual({
      type: 'SET_RECIPIENT',
      from: 'a',
      to: 'b',
      ensRecipient: 'c',
      transactionToName: 'd',
      transactionFromName: 'e',
    });
  });

  it('prepareTransaction', () => {
    expect(prepareTransaction({ to: '0x1' })).toEqual({
      type: 'PREPARE_TRANSACTION',
      transaction: { to: '0x1' },
    });
  });

  it('setTransactionSecurityAlertResponse', () => {
    expect(setTransactionSecurityAlertResponse('id', { a: 1 })).toEqual({
      type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
      transactionId: 'id',
      securityAlertResponse: { a: 1 },
    });
  });

  it('setTransactionObject', () => {
    expect(setTransactionObject({ to: '0x1' })).toEqual({
      type: 'SET_TRANSACTION_OBJECT',
      transaction: { to: '0x1' },
    });
  });

  it('setTransactionId', () => {
    expect(setTransactionId('id')).toEqual({
      type: 'SET_TRANSACTION_ID',
      transactionId: 'id',
    });
  });

  it('setTokensTransaction', () => {
    expect(setTokensTransaction({ address: '0x1' })).toEqual({
      type: 'SET_TOKENS_TRANSACTION',
      asset: { address: '0x1' },
    });
  });

  it('setEtherTransaction', () => {
    expect(setEtherTransaction({ to: '0x1' })).toEqual({
      type: 'SET_ETHER_TRANSACTION',
      transaction: { to: '0x1' },
    });
  });

  it('setNonce and setProposedNonce', () => {
    expect(setNonce(1)).toEqual({ type: 'SET_NONCE', nonce: 1 });
    expect(setProposedNonce(2)).toEqual({
      type: 'SET_PROPOSED_NONCE',
      proposedNonce: 2,
    });
  });

  it('setMaxValueMode', () => {
    expect(setMaxValueMode(true)).toEqual({
      type: 'SET_MAX_VALUE_MODE',
      maxValueMode: true,
    });
  });

  it('setTransactionValue', () => {
    expect(setTransactionValue('0x1')).toEqual({
      type: 'SET_TRANSACTION_VALUE',
      value: '0x1',
    });
  });
});
