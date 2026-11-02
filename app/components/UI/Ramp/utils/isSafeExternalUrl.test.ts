import isSafeExternalUrl from './isSafeExternalUrl';

const scriptScheme = ['java', 'script:'].join('');

describe('isSafeExternalUrl', () => {
  it.each([
    'https://provider.example/privacy',
    'http://provider.example',
    'HTTPS://PROVIDER.EXAMPLE/terms',
  ])('accepts http(s) url %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    '  https://provider.example/support  ',
    'https://provider.example/support\n',
    '\u0000https://provider.example',
    'https://provider.example/a b',
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
