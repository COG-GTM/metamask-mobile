import { getSafeWalletConnectV1RedirectUrl } from './wc-v1-redirect';

const DAPP_URL = 'https://dapp.example';

describe('getSafeWalletConnectV1RedirectUrl', () => {
  it.each([
    ['https://dapp.example/done', 'https://dapp.example/done'],
    ['https://dapp.example', 'https://dapp.example/'],
    ['https://app.dapp.example/x?y=1', 'https://app.dapp.example/x?y=1'],
    ['https://DAPP.example/done', 'https://dapp.example/done'],
  ])('allows %s on the approved dapp host', (redirectUrl, expected) => {
    expect(getSafeWalletConnectV1RedirectUrl(redirectUrl, DAPP_URL)).toBe(
      expected,
    );
  });

  it.each([
    'https://attacker.example/',
    'https://dapp.example.attacker.example/',
    'https://evildapp.example/',
    'http://dapp.example/',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'metamask://wc?uri=x',
    'tel:+15555555555',
    'intent://dapp.example#Intent;scheme=https;end',
    'dappscheme://',
    'https://user:pass@dapp.example/',
    '//dapp.example/',
    '/relative',
    '',
  ])('rejects %s', (redirectUrl) => {
    expect(getSafeWalletConnectV1RedirectUrl(redirectUrl, DAPP_URL)).toBeNull();
  });

  it.each([null, undefined, 42, {}])(
    'rejects non-string redirect %p',
    (redirectUrl) => {
      expect(
        getSafeWalletConnectV1RedirectUrl(redirectUrl, DAPP_URL),
      ).toBeNull();
    },
  );

  it.each([null, undefined, '', 'not a url'])(
    'rejects when the approved dapp url is %p',
    (dappUrl) => {
      expect(
        getSafeWalletConnectV1RedirectUrl('https://dapp.example/', dappUrl),
      ).toBeNull();
    },
  );
});
