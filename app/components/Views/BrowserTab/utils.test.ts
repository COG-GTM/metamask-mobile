import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  getPermissionHostname,
  getPermissionOriginUrl,
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

  describe('ENS permission origin', () => {
    const PATH_GATEWAY = 'https://ipfs.io/ipfs/';
    const GOOD_CID = 'QmGoodDappCid';
    const BAD_CID = 'QmBadDappCid';
    const sessionENSNames: SessionENSNames = {
      [`${PATH_GATEWAY}${GOOD_CID}/`]: {
        hash: GOOD_CID,
        hostname: 'gooddapp.eth',
        type: 'ipfs-ns',
      },
      [`${PATH_GATEWAY}${BAD_CID}/swap?x=1`]: {
        hash: BAD_CID,
        hostname: 'baddapp.eth',
        type: 'ipfs-ns',
      },
      [`${AppConstants.IPNS_DEFAULT_GATEWAY_URL}ipnsdapp.eth/`]: {
        hash: 'k51qzi5uqu5d',
        hostname: 'ipnsdapp.eth',
        type: 'ipns-ns',
      },
      [`${AppConstants.IPNS_DEFAULT_GATEWAY_URL}otheripns.eth/`]: {
        hash: 'k51qzi5uqu5e',
        hostname: 'otheripns.eth',
        type: 'ipns-ns',
      },
    };

    it('keys ENS sites on the same path-based gateway by their ENS name', () => {
      const good = getPermissionOriginUrl(
        `${PATH_GATEWAY}${GOOD_CID}/index.html`,
        sessionENSNames,
      );
      const bad = getPermissionOriginUrl(
        `${PATH_GATEWAY}${BAD_CID}/`,
        sessionENSNames,
      );
      expect(good).toBe('https://gooddapp.eth');
      expect(bad).toBe('https://baddapp.eth');
      expect(new URL(good).hostname).not.toBe(new URL(bad).hostname);
    });

    it('keys IPNS sites on the fixed IPNS gateway by their ENS name', () => {
      expect(
        getPermissionHostname(
          `${AppConstants.IPNS_DEFAULT_GATEWAY_URL}ipnsdapp.eth/app`,
          sessionENSNames,
        ),
      ).toBe('ipnsdapp.eth');
      expect(
        getPermissionHostname(
          `${AppConstants.IPNS_DEFAULT_GATEWAY_URL}otheripns.eth/`,
          sessionENSNames,
        ),
      ).toBe('otheripns.eth');
    });

    it('matches the whole content root, not a prefix of the content hash', () => {
      expect(
        getPermissionHostname(
          `${PATH_GATEWAY}${GOOD_CID}Evil/`,
          sessionENSNames,
        ),
      ).toBe('ipfs.io');
    });

    it('does not map dot-segment escapes out of the content root', () => {
      expect(
        getPermissionHostname(
          `${PATH_GATEWAY}${GOOD_CID}/../${BAD_CID}/`,
          sessionENSNames,
        ),
      ).toBe('ipfs.io');
      expect(
        getPermissionHostname(
          `${PATH_GATEWAY}${GOOD_CID}/%2E%2e/QmOther/`,
          sessionENSNames,
        ),
      ).toBe('ipfs.io');
    });

    it('does not map encoded separator escapes out of the content root', () => {
      [
        `${PATH_GATEWAY}${GOOD_CID}/..%2f${BAD_CID}/`,
        `${PATH_GATEWAY}${GOOD_CID}/..%5C${BAD_CID}/`,
        `${PATH_GATEWAY}${GOOD_CID}/%252e%252e/${BAD_CID}/`,
      ].forEach((url) =>
        expect(getPermissionHostname(url, sessionENSNames)).toBe('ipfs.io'),
      );
    });

    it('prefers the most recently resolved name for a shared content root', () => {
      const names: SessionENSNames = {
        [`${PATH_GATEWAY}${GOOD_CID}/`]: {
          hash: GOOD_CID,
          hostname: 'gooddapp.eth',
          type: 'ipfs-ns',
        },
        [`${PATH_GATEWAY}${GOOD_CID}/app`]: {
          hash: GOOD_CID,
          hostname: 'alias.eth',
          type: 'ipfs-ns',
        },
      };
      expect(getPermissionHostname(`${PATH_GATEWAY}${GOOD_CID}/`, names)).toBe(
        'alias.eth',
      );
    });

    it('does not map the same content path on a different host', () => {
      expect(
        getPermissionOriginUrl(
          `https://evil.example/ipfs/${GOOD_CID}/`,
          sessionENSNames,
        ),
      ).toBe('https://evil.example');
    });

    it('uses the url origin for content not resolved from an ENS name', () => {
      expect(
        getPermissionOriginUrl(`${PATH_GATEWAY}QmUnknown/`, sessionENSNames),
      ).toBe('https://ipfs.io');
      expect(
        getPermissionOriginUrl('https://metamask.io/path', sessionENSNames),
      ).toBe('https://metamask.io');
      expect(getPermissionHostname('', sessionENSNames)).toBe('');
    });

    it('masks ENS content served from a non-default gateway', () => {
      expect(
        getMaskedUrl(`${PATH_GATEWAY}${BAD_CID}/swap?x=1#top`, sessionENSNames),
      ).toBe('https://baddapp.eth/swap?x=1#top');
    });
  });
});
