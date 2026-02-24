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
} from './';

describe('Transaction Actions', () => {
  describe('resetTransaction', () => {
    it('returns RESET_TRANSACTION action', () => {
      expect(resetTransaction()).toEqual({ type: 'RESET_TRANSACTION' });
    });
  });

  describe('newAssetTransaction', () => {
    it('returns ETH asset type when selectedAsset.isETH is true', () => {
      const selectedAsset = { isETH: true, symbol: 'ETH' };
      const result = newAssetTransaction(selectedAsset);
      expect(result).toEqual({
        type: 'NEW_ASSET_TRANSACTION',
        selectedAsset,
        assetType: 'ETH',
      });
    });

    it('returns ERC721 asset type when selectedAsset has tokenId', () => {
      const selectedAsset = { tokenId: '123', address: '0xabc' };
      const result = newAssetTransaction(selectedAsset);
      expect(result).toEqual({
        type: 'NEW_ASSET_TRANSACTION',
        selectedAsset,
        assetType: 'ERC721',
      });
    });

    it('returns ERC20 asset type for non-ETH tokens without tokenId', () => {
      const selectedAsset = { address: '0xabc', symbol: 'DAI' };
      const result = newAssetTransaction(selectedAsset);
      expect(result).toEqual({
        type: 'NEW_ASSET_TRANSACTION',
        selectedAsset,
        assetType: 'ERC20',
      });
    });
  });

  describe('setRecipient', () => {
    it('returns SET_RECIPIENT action with all fields', () => {
      const result = setRecipient(
        '0xfrom',
        '0xto',
        'test.eth',
        'To Name',
        'From Name',
      );
      expect(result).toEqual({
        type: 'SET_RECIPIENT',
        from: '0xfrom',
        to: '0xto',
        ensRecipient: 'test.eth',
        transactionToName: 'To Name',
        transactionFromName: 'From Name',
      });
    });
  });

  describe('setSelectedAsset', () => {
    it('returns ETH asset type for ETH asset', () => {
      const selectedAsset = { isETH: true };
      const result = setSelectedAsset(selectedAsset);
      expect(result).toEqual({
        type: 'SET_SELECTED_ASSET',
        selectedAsset,
        assetType: 'ETH',
      });
    });

    it('returns ERC721 asset type for NFTs', () => {
      const selectedAsset = { tokenId: '1' };
      const result = setSelectedAsset(selectedAsset);
      expect(result).toEqual({
        type: 'SET_SELECTED_ASSET',
        selectedAsset,
        assetType: 'ERC721',
      });
    });

    it('returns ERC20 asset type for tokens', () => {
      const selectedAsset = { address: '0x123', symbol: 'USDC' };
      const result = setSelectedAsset(selectedAsset);
      expect(result).toEqual({
        type: 'SET_SELECTED_ASSET',
        selectedAsset,
        assetType: 'ERC20',
      });
    });
  });

  describe('prepareTransaction', () => {
    it('returns PREPARE_TRANSACTION action', () => {
      const transaction = { from: '0x1', to: '0x2', value: '0x0' };
      expect(prepareTransaction(transaction)).toEqual({
        type: 'PREPARE_TRANSACTION',
        transaction,
      });
    });
  });

  describe('setTransactionSecurityAlertResponse', () => {
    it('returns SET_TRANSACTION_SECURITY_ALERT_RESPONSE action', () => {
      const result = setTransactionSecurityAlertResponse('txId', {
        result_type: 'Malicious',
      });
      expect(result).toEqual({
        type: 'SET_TRANSACTION_SECURITY_ALERT_RESPONSE',
        transactionId: 'txId',
        securityAlertResponse: { result_type: 'Malicious' },
      });
    });
  });

  describe('setTransactionObject', () => {
    it('returns SET_TRANSACTION_OBJECT action', () => {
      const transaction = { from: '0x1', to: '0x2' };
      expect(setTransactionObject(transaction)).toEqual({
        type: 'SET_TRANSACTION_OBJECT',
        transaction,
      });
    });
  });

  describe('setTransactionId', () => {
    it('returns SET_TRANSACTION_ID action', () => {
      expect(setTransactionId('tx-123')).toEqual({
        type: 'SET_TRANSACTION_ID',
        transactionId: 'tx-123',
      });
    });
  });

  describe('setTokensTransaction', () => {
    it('returns SET_TOKENS_TRANSACTION action', () => {
      const asset = { address: '0x123', symbol: 'DAI' };
      expect(setTokensTransaction(asset)).toEqual({
        type: 'SET_TOKENS_TRANSACTION',
        asset,
      });
    });
  });

  describe('setEtherTransaction', () => {
    it('returns SET_ETHER_TRANSACTION action', () => {
      const transaction = { value: '0x1' };
      expect(setEtherTransaction(transaction)).toEqual({
        type: 'SET_ETHER_TRANSACTION',
        transaction,
      });
    });
  });

  describe('setNonce', () => {
    it('returns SET_NONCE action', () => {
      expect(setNonce(5)).toEqual({ type: 'SET_NONCE', nonce: 5 });
    });
  });

  describe('setProposedNonce', () => {
    it('returns SET_PROPOSED_NONCE action', () => {
      expect(setProposedNonce(10)).toEqual({
        type: 'SET_PROPOSED_NONCE',
        proposedNonce: 10,
      });
    });
  });

  describe('setMaxValueMode', () => {
    it('returns SET_MAX_VALUE_MODE action with true', () => {
      expect(setMaxValueMode(true)).toEqual({
        type: 'SET_MAX_VALUE_MODE',
        maxValueMode: true,
      });
    });

    it('returns SET_MAX_VALUE_MODE action with false', () => {
      expect(setMaxValueMode(false)).toEqual({
        type: 'SET_MAX_VALUE_MODE',
        maxValueMode: false,
      });
    });
  });

  describe('setTransactionValue', () => {
    it('returns SET_TRANSACTION_VALUE action', () => {
      expect(setTransactionValue('0x1234')).toEqual({
        type: 'SET_TRANSACTION_VALUE',
        value: '0x1234',
      });
    });
  });
});
