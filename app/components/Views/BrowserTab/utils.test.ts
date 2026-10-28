import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  isMessageFromBridgeFrame,
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

  describe('isMessageFromBridgeFrame', () => {
    const bridgeUrl = 'https://swap.example';

    it('accepts messages from the main frame of the bridge origin', () => {
      expect(
        isMessageFromBridgeFrame(
          { isMainFrame: true, frameOrigin: 'https://swap.example' },
          bridgeUrl,
        ),
      ).toBe(true);
    });

    it('accepts explicit default ports and case differences', () => {
      expect(
        isMessageFromBridgeFrame(
          { isMainFrame: true, frameOrigin: 'https://SWAP.example:443' },
          'https://swap.example/path?x=1',
        ),
      ).toBe(true);
    });

    it('rejects messages posted from iframes, even same-origin ones', () => {
      expect(
        isMessageFromBridgeFrame(
          { isMainFrame: false, frameOrigin: 'https://swap.example' },
          bridgeUrl,
        ),
      ).toBe(false);
      expect(
        isMessageFromBridgeFrame(
          { isMainFrame: false, frameOrigin: 'https://ads.evil.example' },
          bridgeUrl,
        ),
      ).toBe(false);
    });

    it('rejects main-frame messages from a different origin', () => {
      [
        'https://evil.example',
        'http://swap.example',
        'https://swap.example:8443',
        'https://sub.swap.example',
        'null',
      ].forEach((frameOrigin) => {
        expect(
          isMessageFromBridgeFrame(
            { isMainFrame: true, frameOrigin },
            bridgeUrl,
          ),
        ).toBe(false);
      });
    });

    it('rejects messages without native frame info', () => {
      expect(isMessageFromBridgeFrame({}, bridgeUrl)).toBe(false);
      expect(
        isMessageFromBridgeFrame(
          { frameOrigin: 'https://swap.example' },
          bridgeUrl,
        ),
      ).toBe(false);
      expect(isMessageFromBridgeFrame({ isMainFrame: true }, bridgeUrl)).toBe(
        false,
      );
    });

    it('rejects messages when there is no bridge', () => {
      expect(
        isMessageFromBridgeFrame(
          { isMainFrame: true, frameOrigin: 'https://swap.example' },
          undefined,
        ),
      ).toBe(false);
    });
  });
});
