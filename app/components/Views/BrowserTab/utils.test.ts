import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  isHomepageUrl,
  guardScriptToHomepageOrigin,
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

  describe('isHomepageUrl', () => {
    const testCases = [
      { url: AppConstants.HOMEPAGE_URL, expected: true },
      { url: 'https://portfolio.metamask.io', expected: true },
      { url: 'https://home.metamask.io/', expected: true },
      { url: 'portfolio.metamask.io', expected: true },
      { url: 'http://portfolio.metamask.io', expected: false },
      { url: 'http://home.metamask.io/', expected: false },
      { url: 'https://portfolio.metamask.io:8443', expected: false },
      { url: 'https://portfolio.metamask.io.evil.example', expected: false },
      { url: 'https://evil.example/portfolio.metamask.io', expected: false },
      { url: 'https://evil.example', expected: false },
      { url: '', expected: false },
      { url: null, expected: false },
    ];

    testCases.forEach(({ url, expected }) => {
      it(`returns ${expected} for ${url}`, () => {
        expect(isHomepageUrl(url)).toBe(expected);
      });
    });
  });

  describe('guardScriptToHomepageOrigin', () => {
    const runInPage = (href: string) => {
      const { protocol, host } = new URL(href);
      const page = { location: { protocol, host }, __ran: false };
      // eslint-disable-next-line no-new-func
      new Function(
        'window',
        guardScriptToHomepageOrigin('window.__ran = true;'),
      )(page);
      return page.__ran;
    };

    it('runs the script on a homepage origin', () => {
      expect(runInPage('https://portfolio.metamask.io/explore')).toBe(true);
      expect(runInPage('https://home.metamask.io/')).toBe(true);
    });

    it('does not run the script on other origins', () => {
      expect(runInPage('https://evil.example/')).toBe(false);
      expect(runInPage('http://portfolio.metamask.io/')).toBe(false);
      expect(runInPage('https://portfolio.metamask.io.evil.example/')).toBe(
        false,
      );
    });
  });
});
