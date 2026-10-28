import { Alert, AlertButton, Linking } from 'react-native';
import {
  isTLD,
  getAlertMessage,
  getInAppDeeplinkAlertMessage,
  handleNonWebProtocolLink,
  inAppDeeplinkProtocols,
  protocolAllowList,
  trustedProtocolToDeeplink,
  prefixUrlWithProtocol,
  getUrlObj,
  getHost,
  appendURLParams,
  processUrlForBrowser,
} from '.';
import { strings } from '../../../locales/i18n';

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
    const { protocol } = new URL('dapp://testdapp');

    expect(getAlertMessage(protocol, strings)).toBe(
      strings('browser.protocol_alerts.generic'),
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

describe('Browser utils :: trustedProtocolToDeeplink', () => {
  it('should match market: protocol', () => {
    const { protocol } = new URL('market://details?id=io.metamask');

    expect(trustedProtocolToDeeplink.includes(protocol)).toBeTruthy();
  });
  it.each([
    'wc:f82jdjfjakjskdfj',
    'metamask://dapp/portfolio.metamask.io',
    'ethereum://tx',
    'dapp://portfolio.metamask.io',
  ])('should not trust MetaMask own scheme %s', (url) => {
    const { protocol } = new URL(url);

    expect(trustedProtocolToDeeplink.includes(protocol)).toBeFalsy();
    expect(inAppDeeplinkProtocols.includes(protocol)).toBeTruthy();
  });
  it.each([
    'eth://portfolio.metamask.io',
    'tel://portfolio.metamask.io',
    'mailto://portfolio.metamask.io',
    'ldap://portfolio.metamask.io',
  ])('should not match %s', (url) => {
    const { protocol } = new URL(url);

    expect(trustedProtocolToDeeplink.includes(protocol)).toBeFalsy();
    expect(inAppDeeplinkProtocols.includes(protocol)).toBeFalsy();
  });
});

describe('Browser utils :: getInAppDeeplinkAlertMessage', () => {
  it('names the requesting website', () => {
    expect(
      getInAppDeeplinkAlertMessage('https://evil.example/phish?x=1', strings),
    ).toBe(
      strings('browser.protocol_alerts.in_app_deeplink', {
        hostname: 'evil.example',
      }),
    );
    expect(
      getInAppDeeplinkAlertMessage('https://evil.example/phish', strings),
    ).toContain('evil.example');
  });
  it('falls back to a generic message without a requester', () => {
    expect(getInAppDeeplinkAlertMessage('', strings)).toBe(
      strings('browser.protocol_alerts.in_app_deeplink_unknown'),
    );
  });
});

describe('Browser utils :: handleNonWebProtocolLink', () => {
  const requesterUrl = 'https://mallory.example/page';
  let alertSpy: jest.SpyInstance;
  let canOpenSpy: jest.SpyInstance;
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const flush = () => new Promise((resolve) => setImmediate(resolve));

  it.each([
    'ethereum:0x0000000000000000000000000000000000000001@137?value=5e18',
    'metamask://connect?channelId=abc&comm=deeplinking&scheme=mallory',
    'wc:abc@2?relay-protocol=irn&symKey=123',
    'dapp://mallory.example',
  ])('prompts with the requesting site before opening %s', async (url) => {
    const { protocol } = new URL(url);
    handleNonWebProtocolLink({
      url,
      protocol,
      requesterUrl,
      i18nService: strings,
    });
    await flush();

    expect(canOpenSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe(strings('onboarding.warning_title'));
    expect(message).toContain('mallory.example');

    (buttons as AlertButton[])[0].onPress?.();
    await flush();
    expect(openSpy).not.toHaveBeenCalled();

    (buttons as AlertButton[])[1].onPress?.();
    await flush();
    expect(openSpy).toHaveBeenCalledWith(url);
  });

  it('opens trusted external protocols without a prompt', async () => {
    const url = 'market://details?id=io.metamask';
    handleNonWebProtocolLink({
      url,
      protocol: 'market:',
      requesterUrl,
      i18nService: strings,
    });
    await flush();

    expect(alertSpy).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(url);
  });

  it('keeps the generic warning for other protocols', () => {
    handleNonWebProtocolLink({
      url: 'tel:123',
      protocol: 'tel:',
      requesterUrl,
      i18nService: strings,
    });

    expect(alertSpy.mock.calls[0][1]).toBe(
      strings('browser.protocol_alerts.tel'),
    );
    expect(openSpy).not.toHaveBeenCalled();
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
