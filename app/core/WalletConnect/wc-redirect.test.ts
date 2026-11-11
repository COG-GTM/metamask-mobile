/* eslint-disable no-script-url */
import { getSafeWCRedirectLink, isSafeWCRedirectLink } from './wc-redirect';

const PEER_URL = 'https://app.example.com';

describe('isSafeWCRedirectLink', () => {
  it.each([
    'exampledapp://',
    'exampledapp://callback?id=1',
    'https://app.example.com',
    'https://app.example.com/wc?return=1',
    'https://m.app.example.com/',
    'HTTPS://APP.EXAMPLE.COM/',
  ])('allows %s', (link) => {
    expect(isSafeWCRedirectLink(link, PEER_URL)).toBe(true);
  });

  it.each([
    'metamask://',
    'METAMASK://connect',
    'expo-metamask://',
    'wc:abc@2',
    'ethereum:0x0000000000000000000000000000000000000000',
    'dapp://evil.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'vbscript:msgbox',
    'tel:+15555555555',
    'sms:+15555555555',
    'mailto:a@b.c',
    'itms-services://?action=download-manifest&url=https://evil.com/x.plist',
    'app-settings:',
    'App-Prefs:root',
    'shortcuts://run-shortcut?name=x',
    'x-apple-reminderkit://',
    'http://app.example.com',
    'https://evil.com',
    'https://app.example.com.evil.com',
    'https://example.com',
    'https://evilapp.example.com',
    'https://user:pass@app.example.com',
    'https://metamask.app.link/send/0x0',
    'https://link.metamask.io/connect',
    'https://metamask-alternate.app.link/x',
    'https://metamask.test-app.link/x',
    'https://metamask.test.app.link/wc',
    'https://metamask-alternate.test.app.link/wc',
    'https://metamask.io/',
    'not a url',
    '',
  ])('rejects %s', (link) => {
    expect(isSafeWCRedirectLink(link, PEER_URL)).toBe(false);
  });

  it.each([
    'https://metamask.app.link',
    'https://metamask.test.app.link',
    'https://metamask-alternate.test.app.link',
    'https://metamask.io',
  ])(
    'rejects wallet link hosts even when the peer claims them (%s)',
    (peer) => {
      expect(isSafeWCRedirectLink(`${peer}/wc`, peer)).toBe(false);
    },
  );

  it('rejects https links when the peer url is missing or invalid', () => {
    expect(isSafeWCRedirectLink('https://app.example.com', undefined)).toBe(
      false,
    );
    expect(isSafeWCRedirectLink('https://app.example.com', 'garbage')).toBe(
      false,
    );
  });

  it('allows https redirects back to a metamask.io subdomain dApp', () => {
    expect(
      isSafeWCRedirectLink(
        'https://portfolio.metamask.io/',
        'https://portfolio.metamask.io',
      ),
    ).toBe(true);
  });

  it('rejects wallet app-link hosts even when the dApp claims them', () => {
    expect(
      isSafeWCRedirectLink('https://metamask.io/', 'https://metamask.io'),
    ).toBe(false);
    expect(
      isSafeWCRedirectLink(
        'https://metamask.app.link/x',
        'https://metamask.app.link',
      ),
    ).toBe(false);
  });

  it('rejects undefined links', () => {
    expect(isSafeWCRedirectLink(undefined, PEER_URL)).toBe(false);
  });
});

describe('getSafeWCRedirectLink', () => {
  it('prefers a safe native link', () => {
    expect(
      getSafeWCRedirectLink(
        { native: 'exampledapp://', universal: 'https://app.example.com' },
        PEER_URL,
      ),
    ).toBe('exampledapp://');
  });

  it('falls back to a safe universal link when native is unsafe', () => {
    expect(
      getSafeWCRedirectLink(
        { native: 'metamask://', universal: 'https://app.example.com/back' },
        PEER_URL,
      ),
    ).toBe('https://app.example.com/back');
  });

  it('returns undefined when no link is safe', () => {
    expect(
      getSafeWCRedirectLink(
        { native: 'javascript:alert(1)', universal: 'https://evil.com' },
        PEER_URL,
      ),
    ).toBeUndefined();
    expect(getSafeWCRedirectLink(undefined, PEER_URL)).toBeUndefined();
  });
});
