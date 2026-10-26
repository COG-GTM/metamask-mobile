import {
  formatBlockExplorerUrl,
  formatBlockExplorerAddressUrl,
  formatBlockExplorerTransactionUrl,
  MultichainBlockExplorerFormatUrls,
} from './networks';

const urls: MultichainBlockExplorerFormatUrls = {
  url: 'https://explorer.io',
  address: 'https://explorer.io/address/{address}?ref={address}',
  transaction: 'https://explorer.io/tx/{txId}',
};

describe('Multichain networks', () => {
  it('replaces all occurrences of a tag', () => {
    expect(formatBlockExplorerUrl(urls.address, 'address', 'abc')).toBe(
      'https://explorer.io/address/abc?ref=abc',
    );
  });

  it('formats an address url', () => {
    expect(formatBlockExplorerAddressUrl(urls, 'xyz')).toBe(
      'https://explorer.io/address/xyz?ref=xyz',
    );
  });

  it('formats a transaction url', () => {
    expect(formatBlockExplorerTransactionUrl(urls, '0x1')).toBe(
      'https://explorer.io/tx/0x1',
    );
  });
});
