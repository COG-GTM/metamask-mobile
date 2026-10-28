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
 * Whether a WebView bridge message was posted by the top-level document whose
 * origin the BackgroundBridge attributes requests to. Messages from iframes, from
 * a different origin, or without frame info from the native layer are rejected.
 *
 * @param message - Frame info reported by the native WebView for the message
 * @param bridgeUrl - URL the active BackgroundBridge was created for
 */
export const isMessageFromBridgeFrame = (
  message: { isMainFrame?: boolean; frameOrigin?: string },
  bridgeUrl: string | undefined,
): boolean => {
  if (message.isMainFrame !== true || !message.frameOrigin || !bridgeUrl) {
    return false;
  }
  const bridgeOrigin = new URLParse(bridgeUrl).origin;
  const frameOrigin = new URLParse(message.frameOrigin).origin;
  if (!bridgeOrigin || bridgeOrigin === 'null') {
    return false;
  }
  return frameOrigin.toLowerCase() === bridgeOrigin.toLowerCase();
};
