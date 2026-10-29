import { ShouldStartLoadRequest } from '@metamask/react-native-webview/lib/WebViewTypes';
import {
  RAMP_WEBVIEW_ORIGIN_WHITELIST,
  createRampShouldStartLoadWithRequest,
  isRampWebViewNavigationAllowed,
} from './webViewNavigation';

const callbackBaseUrl =
  'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback';

describe('isRampWebViewNavigationAllowed', () => {
  it.each([
    'https://provider.example/checkout',
    'http://provider.example/checkout',
    'HTTPS://PROVIDER.EXAMPLE',
    `${callbackBaseUrl}?orderId=123`,
    'about:blank',
    'about:srcdoc',
  ])('allows %s', (url) => {
    expect(isRampWebViewNavigationAllowed(url, callbackBaseUrl)).toBe(true);
  });

  it.each([
    'metamask://buy?chainId=1',
    'dapp://evil.example',
    'ethereum:0x0000000000000000000000000000000000000000@1',
    'wc:abc@2?relay-protocol=irn',
    'tel:123',
    'sms:123',
    'mailto:someone@example.com',
    'intent://scan/#Intent;scheme=zxing;end',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'about:config',
    'not a url',
    '',
  ])('blocks %s', (url) => {
    expect(isRampWebViewNavigationAllowed(url, callbackBaseUrl)).toBe(false);
  });
});

describe('createRampShouldStartLoadWithRequest', () => {
  const handler = createRampShouldStartLoadWithRequest(callbackBaseUrl);
  const request = (url: string) => ({ url } as ShouldStartLoadRequest);

  it('allows provider and callback navigations', () => {
    expect(handler(request('https://provider.example'))).toBe(true);
    expect(handler(request(`${callbackBaseUrl}?a=b`))).toBe(true);
  });

  it('blocks custom scheme navigations', () => {
    expect(handler(request('metamask://wc?uri=abc'))).toBe(false);
    expect(handler(request('dapp://evil.example'))).toBe(false);
  });
});

describe('RAMP_WEBVIEW_ORIGIN_WHITELIST', () => {
  it('lets every URL reach onShouldStartLoadWithRequest', () => {
    expect(RAMP_WEBVIEW_ORIGIN_WHITELIST).toEqual(['*']);
  });
});
