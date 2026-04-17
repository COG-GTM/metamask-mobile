import {
  getEtherscanAddressUrl,
  getEtherscanTransactionUrl,
  getEtherscanBaseUrl,
} from './etherscan';

describe('etherscan utils', () => {
  describe('getEtherscanBaseUrl', () => {
    it('returns mainnet url for mainnet', () => {
      expect(getEtherscanBaseUrl('mainnet')).toBe('https://etherscan.io');
    });

    it('returns subdomain url for testnets', () => {
      expect(getEtherscanBaseUrl('sepolia')).toBe('https://sepolia.etherscan.io');
    });

    it('returns linea goerli block explorer', () => {
      expect(getEtherscanBaseUrl('linea-goerli')).toContain('lineascan');
    });

    it('returns linea mainnet block explorer', () => {
      expect(getEtherscanBaseUrl('linea-mainnet')).toContain('lineascan');
    });

    it('returns linea sepolia block explorer', () => {
      expect(getEtherscanBaseUrl('linea-sepolia')).toContain('lineascan');
    });
  });

  describe('getEtherscanAddressUrl', () => {
    it('returns address url for mainnet', () => {
      const address = '0x1234567890abcdef';
      const url = getEtherscanAddressUrl('mainnet', address);
      expect(url).toBe(`https://etherscan.io/address/${address}`);
    });

    it('returns address url for sepolia', () => {
      const address = '0xabcdef';
      const url = getEtherscanAddressUrl('sepolia', address);
      expect(url).toBe(`https://sepolia.etherscan.io/address/${address}`);
    });
  });

  describe('getEtherscanTransactionUrl', () => {
    it('returns transaction url for mainnet', () => {
      const txHash = '0xtxhash123';
      const url = getEtherscanTransactionUrl('mainnet', txHash);
      expect(url).toBe(`https://etherscan.io/tx/${txHash}`);
    });

    it('returns transaction url for sepolia', () => {
      const txHash = '0xtxhash456';
      const url = getEtherscanTransactionUrl('sepolia', txHash);
      expect(url).toBe(`https://sepolia.etherscan.io/tx/${txHash}`);
    });
  });
});
