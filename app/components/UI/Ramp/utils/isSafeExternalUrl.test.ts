import isSafeExternalUrl from './isSafeExternalUrl';

const scriptScheme = ['java', 'script:'].join('');

describe('isSafeExternalUrl', () => {
  it.each([
    'https://provider.example/privacy',
    'http://provider.example',
    'HTTPS://PROVIDER.EXAMPLE/terms',
    '  https://provider.example/support  ',
  ])('accepts http(s) url %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    'evilapp://x',
    'metamask://wc?uri=attacker',
    'intent://scan/#Intent;scheme=zxing;end',
    `${scriptScheme}alert(1)`,
    ` ${scriptScheme}alert(1)`,
    'data:text/html,<script>alert(1)</script>',
    'about:blank',
    'file:///etc/passwd',
    'tel:+15555555555',
    'mailto:support@provider.example',
    'provider.example/privacy',
    '//provider.example',
    'https://',
  ])('rejects %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false);
  });
});
