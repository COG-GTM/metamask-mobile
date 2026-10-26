import {
  getEtherscanAddressUrl,
  getEtherscanTransactionUrl,
  getEtherscanBaseUrl,
} from './etherscan';
import {
  LINEA_GOERLI_BLOCK_EXPLORER,
  LINEA_MAINNET_BLOCK_EXPLORER,
  LINEA_SEPOLIA_BLOCK_EXPLORER,
} from '../constants/urls';

describe('etherscan', () => {
  describe('getEtherscanBaseUrl', () => {
    it.each([
      ['linea-goerli', LINEA_GOERLI_BLOCK_EXPLORER],
      ['linea-sepolia', LINEA_SEPOLIA_BLOCK_EXPLORER],
      ['linea-mainnet', LINEA_MAINNET_BLOCK_EXPLORER],
      ['mainnet', 'https://etherscan.io'],
      ['Mainnet', 'https://etherscan.io'],
      ['sepolia', 'https://sepolia.etherscan.io'],
      ['Goerli', 'https://goerli.etherscan.io'],
    ])('returns the base url for %s', (network, expected) => {
      expect(getEtherscanBaseUrl(network)).toBe(expected);
    });
  });

  it('builds an address url', () => {
    expect(getEtherscanAddressUrl('mainnet', '0xabc')).toBe(
      'https://etherscan.io/address/0xabc',
    );
  });

  it('builds a transaction url', () => {
    expect(getEtherscanTransactionUrl('sepolia', '0x123')).toBe(
      'https://sepolia.etherscan.io/tx/0x123',
    );
  });
});
