import {
  isPortfolioUrl,
  isBridgeUrl,
  isValidASCIIURL,
  isSafeSvgUri,
  toPunycodeURL,
} from './index';
import AppConstants from '../../core/AppConstants';

describe('URL Check Functions', () => {
  describe('isPortfolioUrl', () => {
    it('returns true for portfolio URLs', () => {
      const url = AppConstants.PORTFOLIO.URL;
      expect(isPortfolioUrl(url)).toBe(true);
    });

    it('returns false for URLs that were false positive with previous regex implementation', () => {
      const url = 'https://portfolioxmetamask.io';
      expect(isPortfolioUrl(url)).toBe(false);
    });

    it('returns true for portfolio URLs with additional params', () => {
      const url = `${AppConstants.PORTFOLIO.URL}/bridge?foo=bar`;
      expect(isBridgeUrl(url)).toBe(true);
    });

    it('returns false for non-portfolio URLs', () => {
      const url = 'http://www.example.com';
      expect(isPortfolioUrl(url)).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      const url = 'invalid url';
      expect(isPortfolioUrl(url)).toBe(false);
    });
  });

  describe('isBridgeUrl', () => {
    it('returns true for bridge URLs', () => {
      const url = AppConstants.BRIDGE.URL;
      expect(isBridgeUrl(url)).toBe(true);
    });

    it('returns false for URLs that were false positive with previous regex implementation', () => {
      const url = 'https://portfolioxmetamask.io/bridge';
      expect(isPortfolioUrl(url)).toBe(false);
    });

    it('returns true for bridge URLs with additional params', () => {
      const url = `${AppConstants.BRIDGE.URL}?foo=bar`;
      expect(isBridgeUrl(url)).toBe(true);
    });

    it('returns true for bridge URLs with trailing slash', () => {
      const url = `${AppConstants.BRIDGE.URL}/`;
      expect(isBridgeUrl(url)).toBe(true);
    });

    it('returns false for non-bridge URLs', () => {
      const url = 'http://www.example.com';
      expect(isBridgeUrl(url)).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      const url = 'invalid url';
      expect(isBridgeUrl(url)).toBe(false);
    });
  });

  describe('isValidASCIIURL', () => {
    it('returns true for URL containing only ASCII characters in its hostname', () => {
      expect(isValidASCIIURL('https://www.google.com')).toEqual(true);
    });

    it('returns true for URL with both its hostname and path containing ASCII characters', () => {
      expect(
        isValidASCIIURL('https://infura.io/gnosis?x=xn--ifura-dig.io'),
      ).toStrictEqual(true);
    });

    it('returns true for URL with its hostname containing ASCII characters and its path containing non-ASCII characters', () => {
      expect(
        isValidASCIIURL('https://infura.io/gnosis?x=iոfura.io'),
      ).toStrictEqual(true);
      expect(
        isValidASCIIURL('infura.io:7777/gnosis?x=iոfura.io'),
      ).toStrictEqual(true);
    });

    it('returns false for URL with its hostname containing non-ASCII characters', () => {
      expect(isValidASCIIURL('https://iոfura.io/gnosis')).toStrictEqual(false);
      expect(isValidASCIIURL('iոfura.io:7777/gnosis?x=test')).toStrictEqual(
        false,
      );
    });

    it('returns false for empty string', () => {
      expect(isValidASCIIURL('')).toStrictEqual(false);
    });
  });

  describe('isSafeSvgUri', () => {
    it('returns true for https URLs to public hosts', () => {
      expect(isSafeSvgUri('https://example.com/icon.svg')).toBe(true);
      expect(isSafeSvgUri('http://example.com/icon.svg')).toBe(true);
      expect(isSafeSvgUri('https://8.8.8.8/icon.svg')).toBe(true);
    });

    it('returns true for inline data URIs', () => {
      expect(
        isSafeSvgUri('data:image/svg+xml;utf8,<svg></svg>'),
      ).toBe(true);
    });

    it('returns false for empty or missing uris', () => {
      expect(isSafeSvgUri()).toBe(false);
      expect(isSafeSvgUri('')).toBe(false);
      expect(isSafeSvgUri('not a url')).toBe(false);
    });

    it('returns false for non-http(s) schemes', () => {
      expect(isSafeSvgUri('file:///etc/passwd')).toBe(false);
      expect(isSafeSvgUri('ftp://example.com/icon.svg')).toBe(false);
      expect(isSafeSvgUri('blob:https://example.com/abc')).toBe(false);
      // eslint-disable-next-line no-script-url
      expect(isSafeSvgUri('javascript:alert(1)')).toBe(false);
    });

    it('returns false for loopback and localhost hosts', () => {
      expect(isSafeSvgUri('http://localhost/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://sub.localhost/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://127.0.0.1/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://127.5.5.5/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://0.0.0.0/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://[::1]/icon.svg')).toBe(false);
    });

    it('returns false for private and link-local hosts', () => {
      expect(isSafeSvgUri('http://10.0.0.1/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://172.16.0.1/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://172.31.255.255/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://192.168.1.1/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://169.254.169.254/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://[fe80::1]/icon.svg')).toBe(false);
      expect(isSafeSvgUri('http://[fd00::1]/icon.svg')).toBe(false);
    });

    it('returns true for public hosts in ranges adjacent to private ones', () => {
      expect(isSafeSvgUri('http://11.0.0.1/icon.svg')).toBe(true);
      expect(isSafeSvgUri('http://172.15.0.1/icon.svg')).toBe(true);
      expect(isSafeSvgUri('http://172.32.0.1/icon.svg')).toBe(true);
      expect(isSafeSvgUri('http://192.167.0.1/icon.svg')).toBe(true);
    });
  });

  describe('toPunycodeURL', () => {
    it('returns punycode version of URL', () => {
      expect(toPunycodeURL('https://iոfura.io/gnosis')).toStrictEqual(
        'https://xn--ifura-dig.io/gnosis',
      );
      expect(toPunycodeURL('https://iոfura.io')).toStrictEqual(
        'https://xn--ifura-dig.io',
      );
      expect(toPunycodeURL('https://iոfura.io/')).toStrictEqual(
        'https://xn--ifura-dig.io/',
      );
      expect(
        toPunycodeURL('https://iոfura.io/gnosis:5050?test=iոfura&foo=bar'),
      ).toStrictEqual(
        'https://xn--ifura-dig.io/gnosis:5050?test=i%D5%B8fura&foo=bar',
      );

      expect(toPunycodeURL('https://www.google.com')).toStrictEqual(
        'https://www.google.com',
      );
      expect(
        toPunycodeURL('https://opensea.io/language=français'),
      ).toStrictEqual('https://opensea.io/language=fran%C3%A7ais');
    });
  });
});
