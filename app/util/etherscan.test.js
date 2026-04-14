import {
  getEtherscanAddressUrl,
  getEtherscanTransactionUrl,
  getEtherscanBaseUrl,
} from './etherscan';

describe('etherscan', () => {
  describe('getEtherscanBaseUrl', () => {
    it('should return mainnet URL for mainnet', () => {
      const result = getEtherscanBaseUrl('mainnet');
      expect(result).toBe('https://etherscan.io');
    });

    it('should return subdomain URL for testnets', () => {
      const result = getEtherscanBaseUrl('goerli');
      expect(result).toBe('https://goerli.etherscan.io');
    });
  });

  describe('getEtherscanAddressUrl', () => {
    it('should return correct address URL', () => {
      const result = getEtherscanAddressUrl('mainnet', '0x1234');
      expect(result).toBe('https://etherscan.io/address/0x1234');
    });
  });

  describe('getEtherscanTransactionUrl', () => {
    it('should return correct transaction URL', () => {
      const result = getEtherscanTransactionUrl('mainnet', '0xabcd');
      expect(result).toBe('https://etherscan.io/tx/0xabcd');
    });
  });
});
