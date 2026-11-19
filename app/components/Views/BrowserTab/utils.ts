import AppConstants from '../../../core/AppConstants';
import URLParse from 'url-parse';
import { SessionENSNames } from './types';

/**
 * Validates url for browser
 *
 * Regular domains (e.g., google.com)
 * Localhost URLs (e.g., http://localhost:3000)
 * URLs with ports (e.g., http://localhost:1234)
 * HTTPS/HTTP protocols
 *
 * @param url - The url to validate
 * @returns
 */
export const isValidUrl = (url: URLParse<string>): boolean => {
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
  try {
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (urlPattern.test(url.origin) || url.hostname === 'localhost')
    );
  } catch {
    return false;
  }
};

/**
 * Checks if it is a ENS website
 */
export const isENSUrl = (urlToCheck: string, ensIgnoreList: string[]) => {
  const { hostname } = new URLParse(urlToCheck);
  const tld = hostname.split('.').pop();
  if (
    tld &&
    AppConstants.supportedTLDs.indexOf(
      tld.toLowerCase() as 'eth' | 'xyz' | 'test',
    ) !== -1
  ) {
    // Make sure it's not in the ignore list
    if (ensIgnoreList.indexOf(hostname) === -1) {
      return true;
    }
  }
  return false;
};

/**
 * Gets the url to be displayed to the user
 * For example, if it's ens then show [site].eth instead of ipfs url
 */
export const getMaskedUrl = (
  urlToMask: string,
  sessionENSNames: SessionENSNames,
) => {
  if (!urlToMask) return urlToMask;
  let replace = null;
  if (urlToMask.startsWith(AppConstants.IPFS_DEFAULT_GATEWAY_URL)) {
    replace = (key: string) =>
      `${AppConstants.IPFS_DEFAULT_GATEWAY_URL}${sessionENSNames[key].hash}/`;
  } else if (urlToMask.startsWith(AppConstants.IPNS_DEFAULT_GATEWAY_URL)) {
    replace = (key: string) =>
      `${AppConstants.IPNS_DEFAULT_GATEWAY_URL}${sessionENSNames[key].hostname}/`;
  } else if (urlToMask.startsWith(AppConstants.SWARM_DEFAULT_GATEWAY_URL)) {
    replace = (key: string) =>
      `${AppConstants.SWARM_DEFAULT_GATEWAY_URL}${sessionENSNames[key].hash}/`; //TODO: This was SWARM_GATEWAY_URL before, it was broken, understand what it does
  }

  if (replace) {
    const key = Object.keys(sessionENSNames).find((ens) =>
      urlToMask.startsWith(ens),
    );
    if (key) {
      urlToMask = urlToMask.replace(
        replace(key),
        `https://${sessionENSNames[key].hostname}/`,
      );
    }
  }
  return urlToMask;
};

/**
 * Key of the envelope field that carries the per-WebView bridge token.
 */
export const BRIDGE_TOKEN_KEY = '__mmBridgeToken';

/**
 * Builds a script, injected into the main frame only, that replaces
 * `window.ReactNativeWebView` with a wrapper that tags every message with
 * `token`. On Android the native bridge object is exposed to every frame, so
 * cross-origin iframes can call `ReactNativeWebView.postMessage` directly; they
 * cannot read the main frame's token, so their messages can be rejected.
 */
export const getBridgeTokenScript = (token: string): string => `(function () {
  var nativeBridge = window.ReactNativeWebView;
  if (!nativeBridge || typeof nativeBridge.postMessage !== 'function') return;
  var wrappedBridge = Object.freeze({
    postMessage: function (data) {
      var envelope = {};
      envelope[${JSON.stringify(BRIDGE_TOKEN_KEY)}] = ${JSON.stringify(token)};
      envelope.data = data;
      nativeBridge.postMessage(JSON.stringify(envelope));
    },
  });
  try {
    Object.defineProperty(window, 'ReactNativeWebView', {
      value: wrappedBridge,
      writable: false,
      configurable: false,
    });
  } catch (e) {
    window.ReactNativeWebView = wrappedBridge;
  }
})();
`;

/**
 * Unwraps a message produced by the script from `getBridgeTokenScript`.
 * Returns the original message, or `undefined` if the token is missing or wrong.
 */
export const unwrapBridgeMessage = (
  data: string,
  token: string,
): string | undefined => {
  try {
    const envelope = JSON.parse(data);
    if (
      envelope &&
      typeof envelope === 'object' &&
      envelope[BRIDGE_TOKEN_KEY] === token &&
      typeof envelope.data === 'string'
    ) {
      return envelope.data;
    }
  } catch {
    // Not an envelope
  }
  return undefined;
};

/**
 * Whether a WebView message sent while `senderUrl` was loaded in the main frame
 * may be handled by a bridge bound to `bridgeUrl`.
 */
export const isMessageFromBridgeOrigin = (
  senderUrl: string | undefined,
  bridgeUrl: string | undefined,
): boolean => {
  if (!senderUrl || !bridgeUrl) return false;
  const senderOrigin = new URLParse(senderUrl).origin;
  const bridgeOrigin = new URLParse(bridgeUrl).origin;
  return (
    !!senderOrigin && senderOrigin !== 'null' && senderOrigin === bridgeOrigin
  );
};
