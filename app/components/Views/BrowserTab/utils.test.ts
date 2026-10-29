import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  getEnsContentGatewayUrl,
  toCidV1Base32,
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

  describe('toCidV1Base32', () => {
    it('converts an IPFS CIDv0 to a base32 CIDv1', () => {
      expect(
        toCidV1Base32(
          'ipfs-ns',
          'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a',
        ),
      ).toBe('bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m');
    });

    it('converts a Swarm hash to a base32 CIDv1', () => {
      expect(
        toCidV1Base32(
          'swarm-ns',
          'd1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162',
        ),
      ).toBe('bah5acgza2hpjtffu2a47mvendeplez4go2pvqcajevvunbppgfuakjs6ufra');
    });
  });

  describe('getEnsContentGatewayUrl', () => {
    it('uses a per-content subdomain for IPFS content', () => {
      expect(
        getEnsContentGatewayUrl({
          type: 'ipfs-ns',
          hash: 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a',
          hostname: 'example.eth',
          pathname: '/path',
          query: '?a=1',
        }),
      ).toBe(
        `https://bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m.${AppConstants.IPFS_SUBDOMAIN_GATEWAY_HOST}/path?a=1`,
      );
    });

    it('uses a per-content subdomain for Swarm content', () => {
      expect(
        getEnsContentGatewayUrl({
          type: 'swarm-ns',
          hash: 'd1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162',
          hostname: 'swarm.eth',
        }),
      ).toBe(
        `https://bah5acgza2hpjtffu2a47mvendeplez4go2pvqcajevvunbppgfuakjs6ufra.${AppConstants.SWARM_SUBDOMAIN_GATEWAY_HOST}/`,
      );
    });

    it('uses a per-name subdomain for IPNS content', () => {
      expect(
        getEnsContentGatewayUrl({
          type: 'ipns-ns',
          hash: 'Qm456',
          hostname: 'my-app.eth',
          pathname: '/path',
        }),
      ).toBe(
        `https://my--app-eth.${AppConstants.IPNS_SUBDOMAIN_GATEWAY_HOST}/path`,
      );
    });

    it('gives different ENS sites different origins', () => {
      const good = getEnsContentGatewayUrl({
        type: 'ipfs-ns',
        hash: 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a',
        hostname: 'gooddapp.eth',
      }) as string;
      const bad = getEnsContentGatewayUrl({
        type: 'ipfs-ns',
        hash: 'QmQrX8hka2BtNHa8N8arAq16TCVx5qHcb46c5yPewRycLm',
        hostname: 'baddapp.eth',
      }) as string;
      expect(new URLParse(good).hostname).not.toBe(new URLParse(bad).hostname);
    });

    it('returns undefined for unknown content types', () => {
      expect(
        getEnsContentGatewayUrl({
          type: 'unknown',
          hash: 'Qm123',
          hostname: 'example.eth',
        }),
      ).toBeUndefined();
    });
  });

  describe('getMaskedUrl', () => {
    const ipfsUrl = `https://bafy123.${AppConstants.IPFS_SUBDOMAIN_GATEWAY_HOST}/`;
    const ipnsUrl = `https://test-eth.${AppConstants.IPNS_SUBDOMAIN_GATEWAY_HOST}/`;
    const swarmUrl = `https://bah5123.${AppConstants.SWARM_SUBDOMAIN_GATEWAY_HOST}/`;
    const sessionENSNames: SessionENSNames = {
      [ipfsUrl]: {
        hash: 'Qm123',
        hostname: 'example.eth',
        type: 'ipfs-ns',
      },
      [ipnsUrl]: {
        hash: 'Qm456',
        hostname: 'test.eth',
        type: 'ipns-ns',
      },
      [swarmUrl]: {
        hash: 'Qm789',
        hostname: 'swarm.eth',
        type: 'swarm-ns',
      },
    };

    const testCases = [
      {
        input: `${ipfsUrl}path?a=1`,
        expected: 'https://example.eth/path?a=1',
      },
      {
        input: `${ipnsUrl}path`,
        expected: 'https://test.eth/path',
      },
      {
        input: `${swarmUrl}path`,
        expected: 'https://swarm.eth/path',
      },
      {
        input: `https://other.${AppConstants.IPFS_SUBDOMAIN_GATEWAY_HOST}/path`,
        expected: `https://other.${AppConstants.IPFS_SUBDOMAIN_GATEWAY_HOST}/path`,
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
});
