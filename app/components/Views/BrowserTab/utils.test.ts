import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  isUrlFromOrigin,
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

  describe('isUrlFromOrigin', () => {
    it.each([
      ['https://trade.example/swap?x=1', 'https://trade.example', true],
      ['https://trade.example:8443/', 'https://trade.example', false],
      ['http://trade.example/', 'https://trade.example', false],
      ['https://promo.example/', 'https://trade.example', false],
      ['https://trade.example.evil.com/', 'https://trade.example', false],
      ['', 'https://trade.example', false],
      [undefined, 'https://trade.example', false],
    ])('returns %s for %s -> %s', (url, origin, expected) => {
      expect(isUrlFromOrigin(url, origin)).toBe(expected);
    });
  });

  describe('scopeRefToOrigin', () => {
    it('exposes the ref only while the page belongs to the origin', () => {
      const pageUrlRef = { current: 'https://trade.example/swap' };
      const titleRef = { current: 'Trade' };
      const scoped = scopeRefToOrigin(
        titleRef,
        pageUrlRef,
        'https://promo.example',
        'promo.example',
      );

      expect(scoped.current).toBe('promo.example');

      pageUrlRef.current = 'https://promo.example/claim';
      titleRef.current = 'Promo';
      expect(scoped.current).toBe('Promo');

      scoped.current = 'Updated';
      expect(titleRef.current).toBe('Updated');
    });
  });
});
