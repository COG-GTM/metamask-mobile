import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  BRIDGE_TOKEN_KEY,
  getBridgeTokenScript,
  isMessageFromBridgeOrigin,
  unwrapBridgeMessage,
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

describe('bridge token helpers', () => {
  const TOKEN = 'test-token';

  it('wraps ReactNativeWebView so every message carries the token', () => {
    const nativePostMessage = jest.fn();
    const fakeWindow: { ReactNativeWebView?: { postMessage: jest.Mock } } = {
      ReactNativeWebView: { postMessage: nativePostMessage },
    };
    // eslint-disable-next-line no-new-func
    new Function('window', getBridgeTokenScript(TOKEN))(fakeWindow);

    (
      fakeWindow.ReactNativeWebView as unknown as {
        postMessage: (data: string) => void;
      }
    ).postMessage('{"name":"metamask-provider"}');

    expect(nativePostMessage).toHaveBeenCalledTimes(1);
    expect(unwrapBridgeMessage(nativePostMessage.mock.calls[0][0], TOKEN)).toBe(
      '{"name":"metamask-provider"}',
    );
  });

  it('rejects messages without the expected token', () => {
    expect(unwrapBridgeMessage('{"name":"metamask-provider"}', TOKEN)).toBe(
      undefined,
    );
    expect(
      unwrapBridgeMessage(
        JSON.stringify({ [BRIDGE_TOKEN_KEY]: 'other', data: '{}' }),
        TOKEN,
      ),
    ).toBe(undefined);
    expect(unwrapBridgeMessage('not json', TOKEN)).toBe(undefined);
  });

  it('matches sender and bridge by origin', () => {
    expect(
      isMessageFromBridgeOrigin(
        'https://dapp.example/path?q=1',
        'https://dapp.example',
      ),
    ).toBe(true);
    expect(
      isMessageFromBridgeOrigin(
        'https://evil.example/',
        'https://dapp.example',
      ),
    ).toBe(false);
    expect(isMessageFromBridgeOrigin(undefined, 'https://dapp.example')).toBe(
      false,
    );
    expect(isMessageFromBridgeOrigin('about:blank', 'about:blank')).toBe(false);
  });
});
