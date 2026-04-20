import {
  LINEA_GOERLI_BLOCK_EXPLORER,
  LINEA_MAINNET_BLOCK_EXPLORER,
  LINEA_SEPOLIA_BLOCK_EXPLORER,
} from '../constants/urls';
import {
  LINEA_GOERLI,
  LINEA_MAINNET,
  LINEA_SEPOLIA,
  MAINNET,
} from '../constants/network';
import {
  getEtherscanAddressUrl,
  getEtherscanBaseUrl,
  getEtherscanTransactionUrl,
} from './etherscan';

describe('etherscan helpers', () => {
  describe('getEtherscanBaseUrl', () => {
    it('returns Linea block explorers for Linea networks', () => {
      expect(getEtherscanBaseUrl(LINEA_GOERLI)).toBe(
        LINEA_GOERLI_BLOCK_EXPLORER,
      );
      expect(getEtherscanBaseUrl(LINEA_SEPOLIA)).toBe(
        LINEA_SEPOLIA_BLOCK_EXPLORER,
      );
      expect(getEtherscanBaseUrl(LINEA_MAINNET)).toBe(
        LINEA_MAINNET_BLOCK_EXPLORER,
      );
    });

    it('returns etherscan.io without subdomain for mainnet', () => {
      expect(getEtherscanBaseUrl(MAINNET)).toBe('https://etherscan.io');
    });

    it('prefixes etherscan.io with the lowercased network type for testnets', () => {
      expect(getEtherscanBaseUrl('Sepolia')).toBe('https://sepolia.etherscan.io');
    });
  });

  describe('getEtherscanAddressUrl / getEtherscanTransactionUrl', () => {
    it('appends /address/<address>', () => {
      expect(getEtherscanAddressUrl(MAINNET, '0xabc')).toBe(
        'https://etherscan.io/address/0xabc',
      );
    });

    it('appends /tx/<tx_hash>', () => {
      expect(getEtherscanTransactionUrl(MAINNET, '0xdef')).toBe(
        'https://etherscan.io/tx/0xdef',
      );
    });
  });
});
