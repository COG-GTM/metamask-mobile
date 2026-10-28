import {
  getSimpleWebviewHostname,
  isAllowedSimpleWebviewUrl,
  onSimpleWebviewShouldStartLoad,
} from './SimpleWebview.utils';

// Built at runtime so eslint's no-script-url rule doesn't flag test data.
const SCRIPT_URL = ['javascript', 'alert(1)'].join(':');

describe('SimpleWebview utils', () => {
  it.each([
    'https://etherscan.io/tx/0x1',
    'http://localhost.blockscout.example/address/0x1',
    'about:blank',
    'about:srcdoc',
  ])('allows %p', (url) => {
    expect(isAllowedSimpleWebviewUrl(url)).toBe(true);
    expect(onSimpleWebviewShouldStartLoad({ url })).toBe(true);
  });

  it.each([
    SCRIPT_URL,
    'customscheme://x',
    'tel:+15555555555',
    'sms:+15555555555',
    'intent://scan/#Intent;scheme=zxing;end',
    'metamask://wc?uri=x',
    'file:///etc/hosts',
    'data:text/html,<script>alert(1)</script>',
    'not a url',
    '',
  ])('blocks %p', (url) => {
    expect(isAllowedSimpleWebviewUrl(url)).toBe(false);
    expect(onSimpleWebviewShouldStartLoad({ url })).toBe(false);
  });

  it('blocks missing URLs', () => {
    expect(isAllowedSimpleWebviewUrl(undefined)).toBe(false);
  });

  it('returns the hostname of web URLs only', () => {
    expect(getSimpleWebviewHostname('https://opensea.io/assets/1')).toBe(
      'opensea.io',
    );
    expect(getSimpleWebviewHostname(SCRIPT_URL)).toBe('');
    expect(getSimpleWebviewHostname(undefined)).toBe('');
  });
});
