import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  getUrlOrigin,
  scopeRefToOrigin,
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

  describe('getUrlOrigin', () => {
    it('returns the origin of a url', () => {
      expect(getUrlOrigin('https://app.example:8443/path?q=1')).toBe(
        'https://app.example:8443',
      );
    });

    it('returns undefined for a missing url', () => {
      expect(getUrlOrigin(undefined)).toBeUndefined();
      expect(getUrlOrigin('')).toBeUndefined();
    });
  });

  describe('scopeRefToOrigin', () => {
    it('exposes the ref value only while the page belongs to the origin', () => {
      const pageUrlRef = { current: 'https://acme.example/swap' };
      const titleRef = { current: 'Acme Swap' };
      const scoped = scopeRefToOrigin(
        titleRef,
        pageUrlRef,
        'https://acme.example',
        'acme.example',
      );

      expect(scoped.current).toBe('Acme Swap');
      pageUrlRef.current = 'https://mallory.example/';
      expect(scoped.current).toBe('acme.example');
    });

    it('writes through to the underlying ref', () => {
      const pageUrlRef = { current: 'https://acme.example/' };
      const titleRef = { current: 'Old' };
      const scoped = scopeRefToOrigin(
        titleRef,
        pageUrlRef,
        'https://acme.example',
        '',
      );

      scoped.current = 'New';
      expect(titleRef.current).toBe('New');
    });
  });
});
