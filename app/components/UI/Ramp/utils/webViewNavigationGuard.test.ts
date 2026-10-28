import { Alert, AlertButton, Linking } from 'react-native';
import {
  RAMP_WEBVIEW_ORIGIN_WHITELIST,
  createRampWebViewNavigationGuard,
  getUrlProtocol,
} from './webViewNavigationGuard';

const { createOnShouldStartLoadWithRequest } = jest.requireActual(
  '@metamask/react-native-webview/lib/WebViewShared',
);

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const hostileUrls = [
  'metamask://buy?chainId=1',
  'METAMASK://wc?uri=wc:abc',
  'dapp://evil.example',
  'wc:abc@2?relay-protocol=irn&symKey=1',
  'ethereum:0x0000000000000000000000000000000000000001@1?value=1e18',
  // eslint-disable-next-line no-script-url
  'javascript:alert(1)',
  'file:///etc/passwd',
];

describe('getUrlProtocol', () => {
  it.each([
    ['https://provider.example/checkout', 'https:'],
    ['  METAMASK://buy', 'metamask:'],
    ['tel:123', 'tel:'],
    ['about:blank', 'about:'],
    ['/relative', undefined],
  ])('returns the protocol of %s', (url, expected) => {
    expect(getUrlProtocol(url)).toBe(expected);
  });
});

describe('createRampWebViewNavigationGuard', () => {
  let alertSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined as never);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    'https://provider.example/checkout',
    'http://provider.example/checkout',
    'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback?orderId=1',
    'about:blank',
    'about:srcdoc',
  ])('loads %s', (url) => {
    const guard = createRampWebViewNavigationGuard({
      promptForExternalApps: true,
    });
    expect(guard({ url })).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it.each(hostileUrls)(
    'blocks %s without prompting or opening it',
    async (url) => {
      const guard = createRampWebViewNavigationGuard({
        promptForExternalApps: true,
      });
      expect(guard({ url })).toBe(false);
      await flushPromises();
      expect(alertSpy).not.toHaveBeenCalled();
      expect(openURLSpy).not.toHaveBeenCalled();
    },
  );

  it('asks before opening another external scheme and opens it on allow', async () => {
    const guard = createRampWebViewNavigationGuard({
      promptForExternalApps: true,
    });
    expect(guard({ url: 'tel:123' })).toBe(false);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(openURLSpy).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    buttons[1].onPress?.();
    await flushPromises();
    expect(openURLSpy).toHaveBeenCalledWith('tel:123');
  });

  it('does not open the external scheme when the user ignores the prompt', async () => {
    const guard = createRampWebViewNavigationGuard({
      promptForExternalApps: true,
    });
    guard({ url: 'bankapp://pay?id=1' });
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    buttons[0].onPress?.();
    await flushPromises();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('shows at most one prompt at a time', () => {
    const guard = createRampWebViewNavigationGuard({
      promptForExternalApps: true,
    });
    guard({ url: 'tel:1' });
    guard({ url: 'tel:2' });
    guard({ url: 'mailto:a@b.c' });
    expect(alertSpy).toHaveBeenCalledTimes(1);

    (alertSpy.mock.calls[0][2] as AlertButton[])[0].onPress?.();
    guard({ url: 'tel:3' });
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  it('drops every external scheme silently when prompting is disabled', async () => {
    const guard = createRampWebViewNavigationGuard({
      promptForExternalApps: false,
    });
    expect(guard({ url: 'tel:123' })).toBe(false);
    expect(guard({ url: 'metamask://buy' })).toBe(false);
    expect(guard({ url: 'https://provider.example/auth' })).toBe(true);
    await flushPromises();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  describe('wired into the WebView library request handler', () => {
    const navigate = (
      url: string,
      originWhitelist: readonly string[] | undefined,
      onShouldStartLoadWithRequest?: (event: { url: string }) => boolean,
    ) => {
      const loadRequest = jest.fn();
      const handler = createOnShouldStartLoadWithRequest(
        loadRequest,
        originWhitelist ?? ['http://*', 'https://*'],
        onShouldStartLoadWithRequest,
      );
      handler({ nativeEvent: { url, lockIdentifier: 1 } });
      return loadRequest.mock.calls[0][0] as boolean;
    };

    it('library defaults forward custom schemes to Linking.openURL', async () => {
      expect(navigate('metamask://buy?chainId=1', undefined)).toBe(false);
      await flushPromises();
      expect(openURLSpy).toHaveBeenCalledWith('metamask://buy?chainId=1');
    });

    it.each([...hostileUrls, 'tel:123'])(
      'ramp props never auto-open %s',
      async (url) => {
        const guard = createRampWebViewNavigationGuard({
          promptForExternalApps: true,
        });
        expect(navigate(url, RAMP_WEBVIEW_ORIGIN_WHITELIST, guard)).toBe(false);
        await flushPromises();
        expect(openURLSpy).not.toHaveBeenCalled();
      },
    );

    it('ramp props still load https and the callback URL', () => {
      const guard = createRampWebViewNavigationGuard({
        promptForExternalApps: true,
      });
      expect(
        navigate(
          'https://provider.example/checkout',
          RAMP_WEBVIEW_ORIGIN_WHITELIST,
          guard,
        ),
      ).toBe(true);
      expect(
        navigate(
          'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback?a=1',
          RAMP_WEBVIEW_ORIGIN_WHITELIST,
          guard,
        ),
      ).toBe(true);
    });
  });
});
