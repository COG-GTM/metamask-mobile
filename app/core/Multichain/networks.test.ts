import {
  formatBlockExplorerUrl,
  formatBlockExplorerAddressUrl,
  formatBlockExplorerTransactionUrl,
} from './networks';
import type { MultichainBlockExplorerFormatUrls } from './networks';

describe('Multichain networks', () => {
  const mockUrls: MultichainBlockExplorerFormatUrls = {
    url: 'https://blockstream.info',
    address: 'https://blockstream.info/address/{address}' as MultichainBlockExplorerFormatUrls['address'],
    transaction: 'https://blockstream.info/tx/{txId}' as MultichainBlockExplorerFormatUrls['transaction'],
  };

  describe('formatBlockExplorerUrl', () => {
    it('replaces tag with value', () => {
      const result = formatBlockExplorerUrl(
        'https://example.com/{address}' as any,
        'address',
        '0x1234',
      );
      expect(result).toBe('https://example.com/0x1234');
    });

    it('replaces multiple occurrences of the same tag', () => {
      const result = formatBlockExplorerUrl(
        'https://example.com/{id}/{id}' as any,
        'id',
        'abc',
      );
      expect(result).toBe('https://example.com/abc/abc');
    });
  });

  describe('formatBlockExplorerAddressUrl', () => {
    it('formats address URL correctly', () => {
      const result = formatBlockExplorerAddressUrl(mockUrls, '0xABCDEF');
      expect(result).toBe('https://blockstream.info/address/0xABCDEF');
    });
  });

  describe('formatBlockExplorerTransactionUrl', () => {
    it('formats transaction URL correctly', () => {
      const result = formatBlockExplorerTransactionUrl(mockUrls, 'tx123hash');
      expect(result).toBe('https://blockstream.info/tx/tx123hash');
    });
  });
});
