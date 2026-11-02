// eslint-disable-next-line import/no-nodejs-modules
import vm from 'vm';
import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  buildHomepageScripts,
  getHomepageOrigins,
} from './utils';
import URLParse from 'url-parse';
import AppConstants from '../../../core/AppConstants';
import { SessionENSNames } from './types';

describe('BrowserTab utils', () => {
  describe('isValidUrl', () => {
    const testCases = [
      { url: 'https://google.com', expected: true },
      { url: 'http://localhost:3000', expected: true },
      { url: 'http://example.com:8080', expected: false },
      { url: 'https://sub.domain.com', expected: true },
      { url: 'invalid-url', expected: false },
      { url: 'ftp://invalid-protocol.com', expected: false },
    ];

    testCases.forEach(({ url, expected }) => {
      it(`should return ${expected} for ${url}`, () => {
        const parsedUrl = new URLParse(url);
        expect(isValidUrl(parsedUrl)).toBe(expected);
      });
    });
  });

  describe('isENSUrl', () => {
    const ensIgnoreList = ['ignored.eth'];

    const testCases = [
      { url: 'https://example.eth', expected: true },
      { url: 'https://test.xyz', expected: true },
      { url: 'https://domain.test', expected: true },
      { url: 'https://ignored.eth', expected: false },
      { url: 'https://example.com', expected: false },
    ];

    testCases.forEach(({ url, expected }) => {
      it(`should return ${expected} for ${url}`, () => {
        expect(isENSUrl(url, ensIgnoreList)).toBe(expected);
      });
    });
  });

  describe('getMaskedUrl', () => {
    const sessionENSNames: SessionENSNames = {
      // For IPFS: gateway + hash
      [`${AppConstants.IPFS_DEFAULT_GATEWAY_URL}Qm123`]: {
        hash: 'Qm123',
        hostname: 'example.eth',
        type: 'ipfs',
      },
      // For IPNS: gateway + hostname
      [`${AppConstants.IPNS_DEFAULT_GATEWAY_URL}test.eth`]: {
        hash: 'Qm456',
        hostname: 'test.eth',
        type: 'ipns',
      },
      // For Swarm: gateway + hash
      [`${AppConstants.SWARM_DEFAULT_GATEWAY_URL}Qm789`]: {
        hash: 'Qm789',
        hostname: 'swarm.eth',
        type: 'swarm',
      },
    };

    const testCases = [
      {
        input: `${AppConstants.IPFS_DEFAULT_GATEWAY_URL}Qm123/path`,
        expected: 'https://example.eth/path',
      },
      {
        input: `${AppConstants.IPNS_DEFAULT_GATEWAY_URL}test.eth/path`,
        expected: 'https://test.eth/path',
      },
      {
        input: `${AppConstants.SWARM_DEFAULT_GATEWAY_URL}Qm789/path`,
        expected: 'https://swarm.eth/path',
      },
      {
        input: 'https://regular-url.com',
        expected: 'https://regular-url.com',
      },
      {
        input: '',
        expected: '',
      },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should correctly mask ${input}`, () => {
        expect(getMaskedUrl(input, sessionENSNames)).toBe(expected);
      });
    });
  });

  describe('buildHomepageScripts', () => {
    const bookmarks = [{ name: 'Uniswap', url: 'https://app.uniswap.org' }];
    const scriptParams = {
      bookmarks,
      searchEngine: 'Google',
      analyticsEnabled: true,
      distinctId: 'distinct-id',
      mixpanelToken: 'token',
    };

    const runInDocument = (origin: string, script: string) => {
      const leaked = jest.fn();
      const dispatchEvent = jest.fn();
      const fakeWindow: Record<string, unknown> = {
        location: { origin },
        dispatchEvent,
      };
      Object.defineProperty(fakeWindow, '__mmFavorites', {
        set: leaked,
        get: () => undefined,
        configurable: true,
      });
      vm.runInNewContext(script, { window: fakeWindow, Event: class {} });
      return { fakeWindow, leaked, dispatchEvent };
    };

    it('allows the current and legacy homepage origins', () => {
      expect(getHomepageOrigins()).toEqual([
        new URLParse(AppConstants.HOMEPAGE_URL).origin,
        `https://${AppConstants.OLD_HOMEPAGE_URL_HOST}`,
      ]);
    });

    it.each(getHomepageOrigins())(
      'exposes favorites and analytics settings to %s',
      (origin) => {
        const { fakeWindow, leaked, dispatchEvent } = runInDocument(
          origin,
          buildHomepageScripts(scriptParams),
        );
        expect(leaked).toHaveBeenCalledWith(bookmarks);
        expect(fakeWindow.__mmSearchEngine).toBe('Google');
        expect(fakeWindow.__mmMetametrics).toBe(true);
        expect(fakeWindow.__mmDistinctId).toBe('distinct-id');
        expect(fakeWindow.__mmMixpanelToken).toBe('token');
        expect(dispatchEvent).toHaveBeenCalledTimes(1);
      },
    );

    it.each([
      'https://deals.mallory.example',
      'http://portfolio.metamask.io',
      'https://portfolio.metamask.io.mallory.example',
      'null',
    ])('does nothing when the current document is %s', (origin) => {
      const { fakeWindow, leaked, dispatchEvent } = runInDocument(
        origin,
        buildHomepageScripts(scriptParams),
      );
      expect(leaked).not.toHaveBeenCalled();
      expect(fakeWindow.__mmDistinctId).toBeUndefined();
      expect(fakeWindow.__mmMixpanelToken).toBeUndefined();
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('is not affected by a page overriding Array.prototype methods', () => {
      const script = buildHomepageScripts(scriptParams);
      const { leaked } = runInDocument(
        'https://deals.mallory.example',
        `Array.prototype.indexOf = function () { return 0; };
         String.prototype.indexOf = function () { return 0; };
         ${script}`,
      );
      expect(leaked).not.toHaveBeenCalled();
    });

    it('serializes values so they cannot break out of the script', () => {
      const [origin] = getHomepageOrigins();
      const { fakeWindow } = runInDocument(
        origin,
        buildHomepageScripts({
          ...scriptParams,
          searchEngine: 'x"; window.pwned = true; "',
          distinctId: '"; window.pwned = true; "',
        }),
      );
      expect(fakeWindow.pwned).toBeUndefined();
      expect(fakeWindow.__mmSearchEngine).toBe('x"; window.pwned = true; "');
    });
  });
});
