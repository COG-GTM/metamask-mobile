import {
  isValidUrl,
  isENSUrl,
  getMaskedUrl,
  getUrlOrigin,
  scopeRefToOrigin,
  createProviderFrameToken,
  getProviderFrameTokenScript,
  unwrapProviderFrameMessage,
  getProviderMessageSenderOrigin,
} from './utils';
// eslint-disable-next-line import/no-nodejs-modules
import vm from 'vm';
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

  describe('provider frame token', () => {
    const runInFrame = (script: string, setup = '') => {
      const posted: string[] = [];
      const context = vm.createContext({
        nativePostMessage: (message: string) => posted.push(message),
      });
      vm.runInContext(
        // A plain object keeps real property semantics (vm's global proxy ignores writable: false)
        `var window = {};
        window.ReactNativeWebView = { postMessage: nativePostMessage };
        ${setup}`,
        context,
      );
      vm.runInContext(script, context);
      return { context, posted };
    };

    it('creates distinct 32 hex character tokens', () => {
      const token = createProviderFrameToken();
      expect(token).toMatch(/^[0-9a-f]{32}$/);
      expect(createProviderFrameToken()).not.toBe(token);
    });

    it('rejects tokens that could break out of the injected script', () => {
      expect(() => getProviderFrameTokenScript('"};alert(1);//')).toThrow();
    });

    it('seals top frame messages with the token so they unwrap as trusted', () => {
      const token = createProviderFrameToken();
      const { context, posted } = runInFrame(
        getProviderFrameTokenScript(token),
      );
      const message = JSON.stringify({ name: 'metamask-provider', data: 1 });

      vm.runInContext(
        `window.ReactNativeWebView.postMessage(${JSON.stringify(message)})`,
        context,
      );

      expect(posted).toHaveLength(1);
      expect(unwrapProviderFrameMessage(posted[0], token)).toEqual({
        data: message,
        fromTokenFrame: true,
      });
    });

    it('keeps the token away from page scripts that patch builtins or the wrapper', () => {
      const token = createProviderFrameToken();
      const { context, posted } = runInFrame(
        getProviderFrameTokenScript(token),
      );

      const seen = vm.runInContext(
        `var seen = [];
        var record = function (a, b) { seen.push('' + a + ' ' + b); };
        JSON.stringify = function (v) { record(v); return '""'; };
        String = function (v) { record(v); return ''; };
        Function.prototype.call = record;
        Function.prototype.apply = record;
        Function.prototype.bind = record;
        try { window.ReactNativeWebView = { postMessage: record }; } catch (e) {}
        try { window.ReactNativeWebView.postMessage = record; } catch (e) {}
        window.ReactNativeWebView.postMessage('{"name":"x"}');
        seen.join('|')`,
        context,
      );

      expect(seen).not.toContain(token);
      expect(posted).toHaveLength(1);
      expect(unwrapProviderFrameMessage(posted[0], token)?.fromTokenFrame).toBe(
        true,
      );
    });

    it('does not wrap the bridge twice when the script is injected again', () => {
      const token = createProviderFrameToken();
      const script = getProviderFrameTokenScript(token);
      const { context, posted } = runInFrame(script);
      vm.runInContext(script, context);

      vm.runInContext(`window.ReactNativeWebView.postMessage('{}')`, context);

      expect(unwrapProviderFrameMessage(posted[0], token)).toEqual({
        data: '{}',
        fromTokenFrame: true,
      });
    });

    it('treats messages without an envelope as untrusted and drops envelopes with another token', () => {
      const token = createProviderFrameToken();
      const raw = JSON.stringify({ name: 'metamask-provider' });

      expect(unwrapProviderFrameMessage(raw, token)).toEqual({
        data: raw,
        fromTokenFrame: false,
      });
      expect(unwrapProviderFrameMessage('not json', token)).toEqual({
        data: 'not json',
        fromTokenFrame: false,
      });
      expect(
        unwrapProviderFrameMessage(
          JSON.stringify({ mmFrameToken: 'f'.repeat(32), mmData: raw }),
          token,
        ),
      ).toBeUndefined();
      expect(
        unwrapProviderFrameMessage(
          JSON.stringify({ mmFrameToken: token, mmData: { name: 'x' } }),
          token,
        ),
      ).toBeUndefined();
    });
  });

  describe('getProviderMessageSenderOrigin', () => {
    it('uses the native sender frame origin over the WebView url', () => {
      expect(
        getProviderMessageSenderOrigin(
          {
            url: 'https://acme-swap.example/',
            frameOrigin: 'https://mallory.example',
            isMainFrame: true,
          },
          true,
        ),
      ).toBe('https://mallory.example');
      expect(
        getProviderMessageSenderOrigin(
          {
            url: 'https://app.example/',
            frameOrigin: 'https://app.example:8443',
            isMainFrame: true,
          },
          false,
        ),
      ).toBe('https://app.example:8443');
    });

    it('rejects iframes and opaque origins reported by the native WebView', () => {
      expect(
        getProviderMessageSenderOrigin(
          {
            url: 'https://app.example/',
            frameOrigin: 'https://app.example',
            isMainFrame: false,
          },
          true,
        ),
      ).toBeUndefined();
      expect(
        getProviderMessageSenderOrigin(
          {
            url: 'https://app.example/',
            frameOrigin: 'null',
            isMainFrame: true,
          },
          true,
        ),
      ).toBeUndefined();
      expect(
        getProviderMessageSenderOrigin(
          { url: 'https://app.example/', frameOrigin: 'https://app.example' },
          true,
        ),
      ).toBeUndefined();
    });

    it('falls back to the WebView url only for the top frame token wrapper', () => {
      expect(
        getProviderMessageSenderOrigin({ url: 'https://app.example/x' }, true),
      ).toBe('https://app.example');
      expect(
        getProviderMessageSenderOrigin({ url: 'https://app.example/x' }, false),
      ).toBeUndefined();
    });
  });
});
