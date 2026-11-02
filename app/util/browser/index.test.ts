import {
  isTLD,
  getAlertMessage,
  protocolAllowList,
  inAppDeeplinkProtocols,
  blockedProtocols,
  browserWebViewOriginWhitelist,
  getProtocolNavigationAction,
  handleProtocolNavigation,
  prefixUrlWithProtocol,
  getUrlObj,
  getHost,
  appendURLParams,
  processUrlForBrowser,
} from '.';
import { strings } from '../../../locales/i18n';
import { Alert, Linking } from 'react-native';
import URLParse from 'url-parse';
import { createOnShouldStartLoadWithRequest } from '@metamask/react-native-webview/src/WebViewShared';

describe('Browser utils :: prefixUrlWithProtocol', () => {
  it('should prefix url with https: protocol', () => {
    const url = prefixUrlWithProtocol('test.com');
    expect(url).toBe('https://test.com');
  });

  it('should respect the original protocol ', () => {
    const url = prefixUrlWithProtocol('http://test.com');
    expect(url).toBe('http://test.com');
  });

  it('should respect the default protocol ', () => {
    const url = prefixUrlWithProtocol('test.com', 'http://');
    expect(url).toBe('http://test.com');
  });
});

describe('Browser utils :: onUrlSubmit', () => {
  it('should prefix url with https: protocol', () => {
    const url = processUrlForBrowser('test.com');
    expect(url).toBe('https://test.com');
  });

  it('should respect the default protocol', () => {
    const url = processUrlForBrowser('test.com', 'Google');
    expect(url).toBe('https://test.com');
  });

  it('should generate a seach engine link if it we pass non url', () => {
    const keyword = 'test';
    const url = processUrlForBrowser(keyword, 'Google');
    const expectedUrl =
      'https://www.google.com/search?q=' + encodeURIComponent(keyword);
    expect(url).toBe(expectedUrl);
  });

  it('should choose the search engine based on the params', () => {
    const keyword = 'test';
    const url = processUrlForBrowser(keyword, 'DuckDuckGo');
    const expectedUrl =
      'https://duckduckgo.com/?q=' + encodeURIComponent(keyword);
    expect(url).toBe(expectedUrl);
  });

  it('should detect keywords with several words', () => {
    const keyword = 'what is a test';
    const url = processUrlForBrowser(keyword, 'DuckDuckGo');
    const expectedUrl =
      'https://duckduckgo.com/?q=' + encodeURIComponent(keyword);
    expect(url).toBe(expectedUrl);
  });

  it('should detect urls without path', () => {
    const input = 'https://metamask.io';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with empty path', () => {
    const input = 'https://metamask.io/';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with path', () => {
    const input = 'https://metamask.io/about';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with path and slash at the end', () => {
    const input = 'https://metamask.io/about';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with path and querystring', () => {
    const input = 'https://metamask.io/about?utm_content=tests';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with path and querystring with multiple params', () => {
    const input = 'https://metamask.io/about?utm_content=tests&utm_source=jest';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });

  it('should detect urls with querystring params with escape characters', () => {
    const input = 'https://some.com/search?q=what+is+going&a=i+dont+know';
    const url = processUrlForBrowser(input, 'DuckDuckGo');
    expect(url).toBe(input);
  });
});

describe('Browser utils :: isTLD', () => {
  it('should return true if it ends on .xyz', () => {
    const hostname = 'evan.xyz';
    const error = '';
    expect(isTLD(hostname, error)).toBeTruthy();
  });

  it('should return true if it ends on .test', () => {
    const hostname = 'evan.test';
    const error = '';
    expect(isTLD(hostname, error)).toBeTruthy();
  });

  it('should return true if the error contains is not standard', () => {
    const hostname = 'ebisusbay.xyz';
    const error = 'is not standard';
    expect(isTLD(hostname, error)).toBeTruthy();
  });

  it('should return false if it ends on .eth', () => {
    const hostname = 'evan.eth';
    const error = '';
    expect(isTLD(hostname, error)).toBeFalsy();
  });
});

describe('Browser utils :: getUrlObj', () => {
  it('should return an URL object', () => {
    const url = 'http://metamask.io';
    const { hostname, protocol } = getUrlObj(url);
    expect(hostname).toBe('metamask.io');
    expect(protocol).toBe('http:');
  });
});

describe('Browser utils :: getHost', () => {
  it('should return hostname', () => {
    const url = 'http://metamask.io';
    const hostname = getHost(url);
    expect(hostname).toBe('metamask.io');
  });
  it('should return the complete url', () => {
    const url = 'about:blank';
    const hostname = getHost(url);
    expect(hostname).toBe('about:blank');
  });
  it('should return the malformed url', () => {
    const url = 'metamask';
    const hostname = getHost(url);
    expect(hostname).toBe('metamask');
  });
});

describe('Browser utils :: getAlertMessage', () => {
  it('should mailto alert message', () => {
    const { protocol } = new URL('mailto:testtmail');
    const matchingMessage =
      getAlertMessage(protocol, strings) ===
      strings('browser.protocol_alerts.mailto');

    expect(matchingMessage).toBeTruthy();
  });
  it('should return tel alert message', () => {
    const { protocol } = new URL('tel:1111');

    expect(getAlertMessage(protocol, strings)).toBe(
      strings('browser.protocol_alerts.tel'),
    );
  });
  it('should return generic alert message', () => {
    const { protocol } = new URL('sms:12345');

    expect(getAlertMessage(protocol, strings)).toBe(
      strings('browser.protocol_alerts.generic'),
    );
  });
  it('should return MetaMask deeplink alert message', () => {
    const { protocol } = new URL('dapp://testdapp');

    expect(getAlertMessage(protocol, strings)).toBe(
      strings('browser.protocol_alerts.metamask'),
    );
  });
});

describe('Browser utils :: protocolWhitelist', () => {
  it('should match about: protocol', () => {
    const { protocol } = new URL('about:config');

    expect(protocolAllowList.includes(protocol)).toBeTruthy();
  });
  it('should match http: protocol', () => {
    const { protocol } = new URL('http://meta.io');

    expect(protocolAllowList.includes(protocol)).toBeTruthy();
  });
  it('should match https: protocol', () => {
    const { protocol } = new URL('https://meta.io');

    expect(protocolAllowList.includes(protocol)).toBeTruthy();
  });
});

describe('Browser utils :: inAppDeeplinkProtocols', () => {
  it.each([
    'wc:f82jdjfjakjskdfj',
    'metamask://dapp/portfolio.metamask.io',
    'ethereum://tx',
    'dapp://portfolio.metamask.io',
  ])('matches %s', (url) => {
    expect(inAppDeeplinkProtocols.includes(new URL(url).protocol)).toBe(true);
  });

  it.each([
    'market://details?id=io.metamask',
    'eth://portfolio.metamask.io',
    'tel://portfolio.metamask.io',
    'mailto://portfolio.metamask.io',
    'ldap://portfolio.metamask.io',
  ])('does not match %s', (url) => {
    expect(inAppDeeplinkProtocols.includes(new URL(url).protocol)).toBe(false);
  });
});

describe('Browser utils :: getProtocolNavigationAction', () => {
  const actionFor = (url: string, isTopFrame?: boolean) =>
    getProtocolNavigationAction(new URLParse(url).protocol, isTopFrame);

  it.each(['https://meta.io', 'http://meta.io', 'about:srcdoc', 'about:blank'])(
    'loads %s in the webview',
    (url) => {
      expect(actionFor(url)).toBe('load');
      expect(actionFor(url, false)).toBe('load');
    },
  );

  it.each([
    'metamask://connect?channelId=abc',
    'wc:f82jdjfjakjskdfj@2',
    'ethereum:0x0000000000000000000000000000000000000000',
    'dapp://portfolio.metamask.io',
    'METAMASK://connect',
  ])('prompts before handling MetaMask deeplink %s', (url) => {
    expect(actionFor(url)).toBe('prompt-deeplink');
  });

  it.each([
    'market://details?id=com.fake.wallet',
    'sms:+15555550123?body=test',
    'tel:+15555550123',
    'mailto:mallory@example.com',
    'itms-apps://itunes.apple.com/app/id1',
    'twitter://post?message=hi',
    'intent://scan/#Intent;scheme=zxing;end',
    'file:///etc/hosts',
    'SMS:+15555550123',
  ])('prompts before opening external %s', (url) => {
    expect(actionFor(url)).toBe('prompt-external');
  });

  it.each([
    'sms:+15555550123?body=test',
    'itms-apps://itunes.apple.com/app/id1',
    'metamask://connect?channelId=abc',
    'wc:f82jdjfjakjskdfj@2',
  ])('blocks %s from a sub-frame', (url) => {
    expect(actionFor(url, false)).toBe('block');
  });

  it.each(blockedProtocols.map((protocol) => `${protocol}payload`))(
    'blocks %s',
    (url) => {
      expect(actionFor(url)).toBe('block');
    },
  );
});

describe('Browser utils :: browserWebViewOriginWhitelist + handleProtocolNavigation', () => {
  type AlertButtons = { text: string; onPress: () => void }[];

  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
  const openInAppDeeplink = jest.fn();

  let alertSpy: jest.SpyInstance;

  // Drives the real WebView library request filter with the browser handler,
  // as BrowserTab wires it up
  const navigate = (
    url: string,
    { isTopFrame = true, originWhitelist = browserWebViewOriginWhitelist } = {},
  ) => {
    const loadRequest = jest.fn();
    createOnShouldStartLoadWithRequest(
      loadRequest,
      originWhitelist,
      ({ url: requestUrl, isTopFrame: requestIsTopFrame }) =>
        handleProtocolNavigation(requestUrl, {
          isTopFrame: requestIsTopFrame,
          openInAppDeeplink,
        }),
    )({
      nativeEvent: { url, lockIdentifier: 1, isTopFrame },
    } as unknown as Parameters<ReturnType<typeof createOnShouldStartLoadWithRequest>>[0]);
    return loadRequest;
  };

  const pressAlertButton = (text: string, call = 0) => {
    const buttons = alertSpy.mock.calls[call][2] as AlertButtons;
    buttons.find((button) => button.text === text)?.onPress();
  };

  const allow = (call?: number) =>
    pressAlertButton(strings('browser.protocol_alert_options.allow'), call);
  const ignore = (call?: number) =>
    pressAlertButton(strings('browser.protocol_alert_options.ignore'), call);

  beforeEach(() => {
    // RN's Linking is a jest.fn in the global setup, so reset call counts here
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    // Close any prompt left open so the next test starts without one
    if (alertSpy.mock.calls.length) {
      alertSpy.mock.calls.forEach((_, call) => ignore(call));
    }
    alertSpy.mockRestore();
  });

  it('the legacy whitelist lets the library open sms: without the handler', async () => {
    const handler = jest.fn();
    const loadRequest = jest.fn();
    createOnShouldStartLoadWithRequest(
      loadRequest,
      ['https://', 'http://', 'metamask://', 'about:srcdoc'],
      handler,
    )({
      nativeEvent: { url: 'sms:12345?body=test', lockIdentifier: 1 },
    } as unknown as Parameters<ReturnType<typeof createOnShouldStartLoadWithRequest>>[0]);
    await flushPromises();

    expect(handler).not.toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalledWith('sms:12345?body=test');
  });

  it.each([
    'sms:12345?body=test',
    'itms-apps://itunes.apple.com/app/id1',
    'tel:+15555550123',
    'twitter://post?message=hi',
    'market://details?id=com.fake.wallet',
  ])(
    'prompts and opens nothing for %s until the user allows it',
    async (url) => {
      const loadRequest = navigate(url);
      await flushPromises();

      expect(loadRequest).toHaveBeenCalledWith(false, url, 1);
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0][0]).toBe(
        strings('onboarding.warning_title'),
      );
      expect(Linking.canOpenURL).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();

      allow();
      await flushPromises();
      expect(Linking.openURL).toHaveBeenCalledWith(url);
      expect(openInAppDeeplink).not.toHaveBeenCalled();
    },
  );

  it('opens nothing when the user taps Ignore', async () => {
    navigate('sms:12345?body=test');
    ignore();
    await flushPromises();

    expect(Linking.canOpenURL).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it.each([
    'metamask://connect?channelId=abc',
    'wc:f82jdjfjakjskdfj@2?relay-protocol=irn&symKey=abc',
    'ethereum:0x0000000000000000000000000000000000000000@1?value=1e18',
    'dapp://portfolio.metamask.io',
  ])(
    'prompts for MetaMask deeplink %s and hands it to the in-app handler only after Allow',
    async (url) => {
      const loadRequest = navigate(url);
      await flushPromises();

      expect(loadRequest).toHaveBeenCalledWith(false, url, 1);
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0][1]).toBe(
        strings('browser.protocol_alerts.metamask'),
      );
      expect(openInAppDeeplink).not.toHaveBeenCalled();

      allow();
      await flushPromises();
      expect(openInAppDeeplink).toHaveBeenCalledWith(url);
      // Never bounced through the OS, where it would look like an external link
      expect(Linking.canOpenURL).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    },
  );

  it('drops further requests while a prompt is showing', async () => {
    navigate('sms:12345?body=test');
    navigate('metamask://connect?channelId=abc');
    navigate('itms-apps://itunes.apple.com/app/id1');
    await flushPromises();
    expect(alertSpy).toHaveBeenCalledTimes(1);

    ignore();
    navigate('itms-apps://itunes.apple.com/app/id1');
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  it('a dismissed prompt allows the next request to prompt again', () => {
    navigate('sms:12345?body=test');
    const options = alertSpy.mock.calls[0][3] as { onDismiss: () => void };
    options.onDismiss();

    navigate('sms:12345?body=test');
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  it.each([
    'sms:12345?body=test',
    'metamask://connect?channelId=abc',
    'itms-apps://itunes.apple.com/app/id1',
  ])('blocks %s from a sub-frame without prompting', async (url) => {
    const loadRequest = navigate(url, { isTopFrame: false });
    await flushPromises();

    expect(loadRequest).toHaveBeenCalledWith(false, url, 1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(openInAppDeeplink).not.toHaveBeenCalled();
  });

  it.each(['https://meta.io', 'http://meta.io', 'about:srcdoc'])(
    'loads %s',
    async (url) => {
      const loadRequest = navigate(url);
      await flushPromises();

      expect(loadRequest).toHaveBeenCalledWith(true, url, 1);
      expect(alertSpy).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    },
  );

  it.each([
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('blocks %s without prompting or opening it', async (url) => {
    const loadRequest = navigate(url);
    await flushPromises();

    expect(loadRequest).toHaveBeenCalledWith(false, url, 1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(Linking.canOpenURL).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});

describe('Browser utils :: appendURLParams', () => {
  it('should append search parameters to a URL string', () => {
    const baseUrl = 'https://metamask.io';
    const params = {
      utm_source: 'test',
      utm_medium: 'unit',
      active: true,
      count: 42,
    };

    const result = appendURLParams(baseUrl, params);

    expect(result.toString()).toBe(
      'https://metamask.io/?utm_source=test&utm_medium=unit&active=true&count=42',
    );
  });

  it('should append parameters to a URL with existing params', () => {
    const baseUrl = 'https://metamask.io/?existing=param';
    const params = {
      new: 'parameter',
    };

    const result = appendURLParams(baseUrl, params);

    expect(result.toString()).toBe(
      'https://metamask.io/?existing=param&new=parameter',
    );
  });

  it('should work with URL object input', () => {
    const baseUrl = new URL('https://metamask.io');
    const params = {
      test: 'value',
    };

    const result = appendURLParams(baseUrl, params);

    expect(result.toString()).toBe('https://metamask.io/?test=value');
  });

  it('should handle empty params object', () => {
    const baseUrl = 'https://metamask.io';
    const params = {};

    const result = appendURLParams(baseUrl, params);

    expect(result.toString()).toBe('https://metamask.io/');
  });
});
