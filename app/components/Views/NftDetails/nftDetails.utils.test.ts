import { getSafeMarketplaceUrl } from './nftDetails.utils';

describe('getSafeMarketplaceUrl', () => {
  it('returns https marketplace URLs', () => {
    expect(getSafeMarketplaceUrl('https://opensea.io/assets/1')).toBe(
      'https://opensea.io/assets/1',
    );
  });

  it('prefixes bare domains with https', () => {
    expect(getSafeMarketplaceUrl('opensea.io')).toBe('https://opensea.io/');
  });

  it.each([
    undefined,
    '',
    '   ',
    'javascript:alert(1)',
    'customscheme://x',
    'http://opensea.io',
    'file:///etc/passwd',
    'data://text/html,<script>alert(1)</script>',
    'https://user:pass@opensea.io',
    'https://localhost',
    'https://a b.com',
  ])('rejects unsafe value %p', (value) => {
    expect(getSafeMarketplaceUrl(value)).toBeUndefined();
  });
});
