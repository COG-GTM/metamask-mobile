import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  getMessageBridgeAction,
  getMessageSenderOrigin,
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
});

describe('getMessageSenderOrigin', () => {
  it('prefers the posting frame URL over the WebView URL', () => {
    expect(
      getMessageSenderOrigin({
        url: 'https://globex-swap.example/some-download',
        frameUrl: 'https://prize-drop.example/play',
        isMainFrame: true,
      }),
    ).toBe('https://prize-drop.example');
  });

  it('falls back to the WebView URL when no frame URL is reported', () => {
    expect(
      getMessageSenderOrigin({ url: 'https://app.uniswap.org/swap' }),
    ).toBe('https://app.uniswap.org');
  });

  it('rejects messages from subframes', () => {
    expect(
      getMessageSenderOrigin({
        url: 'https://app.uniswap.org/',
        frameUrl: 'https://ads.example/frame',
        isMainFrame: false,
      }),
    ).toBeUndefined();
  });

  it('rejects messages without a usable sender URL', () => {
    expect(
      getMessageSenderOrigin({ url: 'https://app.uniswap.org/', frameUrl: '' }),
    ).toBeUndefined();
    expect(getMessageSenderOrigin({ url: '' })).toBeUndefined();
    expect(getMessageSenderOrigin({ url: 'about:blank' })).toBeUndefined();
  });
});

describe('getMessageBridgeAction', () => {
  it('forwards messages from the page the bridge was created for', () => {
    expect(
      getMessageBridgeAction({
        senderOrigin: 'https://prize-drop.example',
        bridgeOrigin: 'https://prize-drop.example',
        allowedNavigationOrigin: 'https://globex-swap.example',
      }),
    ).toBe('forward');
  });

  it('re-keys the bridge once the allowed navigation target posts a message', () => {
    expect(
      getMessageBridgeAction({
        senderOrigin: 'https://globex-swap.example',
        bridgeOrigin: 'https://prize-drop.example',
        allowedNavigationOrigin: 'https://globex-swap.example',
      }),
    ).toBe('rekey');
    expect(
      getMessageBridgeAction({
        senderOrigin: 'https://globex-swap.example',
        allowedNavigationOrigin: 'https://globex-swap.example',
      }),
    ).toBe('rekey');
  });

  it('drops messages from any other origin', () => {
    expect(
      getMessageBridgeAction({
        senderOrigin: 'https://prize-drop.example',
        bridgeOrigin: 'https://globex-swap.example',
        allowedNavigationOrigin: 'https://globex-swap.example',
      }),
    ).toBe('drop');
    expect(
      getMessageBridgeAction({
        senderOrigin: undefined,
        bridgeOrigin: 'https://globex-swap.example',
      }),
    ).toBe('drop');
  });
});
