import {
  isTLD,
  getAlertMessage,
  protocolAllowList,
  promptToOpenExternalLink,
  prefixUrlWithProtocol,
  getUrlObj,
  getHost,
  appendURLParams,
  processUrlForBrowser,
} from '.';
import { Alert, AlertButton, Linking } from 'react-native';
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

describe('Browser utils :: promptToOpenExternalLink', () => {
  let alertSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  const pressButton = (index: number) => {
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    buttons[index].onPress?.();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    'metamask://connect?channelId=1',
    'ethereum:0x0000000000000000000000000000000000000001@1?value=1',
    'wc:abc@2?relay-protocol=irn',
    'dapp://portfolio.metamask.io',
    'market://details?id=io.metamask',
    'sms:123?body=test',
    'https://example.com/pass.pkpass',
  ])('asks for consent before opening %s', (url) => {
    promptToOpenExternalLink(url);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][1]).toBe(
      strings('browser.protocol_alerts.generic'),
    );
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('uses the protocol specific warning message', () => {
    promptToOpenExternalLink('tel:123');

    expect(alertSpy.mock.calls[0][1]).toBe(
      strings('browser.protocol_alerts.tel'),
    );
  });

  it('does not open the link when the user ignores the prompt', async () => {
    const result = promptToOpenExternalLink('metamask://connect');
    pressButton(0);

    expect(await result).toBe(false);
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('does not open the link when the prompt is dismissed', async () => {
    const result = promptToOpenExternalLink('metamask://connect');
    alertSpy.mock.calls[0][3].onDismiss();

    expect(await result).toBe(false);
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('opens the link only after the user allows it', async () => {
    const url = 'ethereum:0x0000000000000000000000000000000000000001@1';
    const result = promptToOpenExternalLink(url);
    pressButton(1);

    expect(await result).toBe(true);
    expect(openURLSpy).toHaveBeenCalledWith(url);
  });

  it('resolves false when the OS cannot open the allowed link', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const result = promptToOpenExternalLink('unknown-scheme://x');
    pressButton(1);

    expect(await result).toBe(false);
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('resolves false when opening the allowed link fails', async () => {
    openURLSpy.mockRejectedValue(new Error('failed'));
    const result = promptToOpenExternalLink('metamask://connect');
    pressButton(1);

    expect(await result).toBe(false);
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
