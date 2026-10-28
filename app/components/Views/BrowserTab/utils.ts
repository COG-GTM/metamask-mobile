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
 * Origin of the document that posted a WebView message.
 *
 * On iOS the WebView `url` is WKWebView's active URL, which already points at
 * a provisional (not yet committed) navigation while the previous document is
 * still running. The patched iOS WebView therefore also reports `frameUrl`
 * (the URL of the frame that actually called postMessage) and `isMainFrame`,
 * which are preferred when present.
 */
export const getMessageSenderOrigin = (nativeEvent: {
  url?: string;
  frameUrl?: string;
  isMainFrame?: boolean;
}): string | undefined => {
  if (nativeEvent.isMainFrame === false) return undefined;
  const senderUrl = nativeEvent.frameUrl ?? nativeEvent.url;
  if (!senderUrl) return undefined;
  const { origin } = new URLParse(senderUrl);
  if (!origin || origin === 'null') return undefined;
  return origin;
};

export type MessageBridgeAction = 'forward' | 'rekey' | 'drop';

/**
 * Decides how a provider message is routed to the background bridge.
 *
 * - `forward`: the sender is the page the current bridge was created for.
 * - `rekey`: the sender is the page of the latest top-frame navigation that
 * passed the phishing check, so it has committed and gets a fresh bridge.
 * - `drop`: any other sender (e.g. a page whose navigation to another origin
 * was cancelled, or a blocked origin) must not reach the bridge.
 */
export const getMessageBridgeAction = ({
  senderOrigin,
  bridgeOrigin,
  allowedNavigationOrigin,
}: {
  senderOrigin?: string;
  bridgeOrigin?: string;
  allowedNavigationOrigin?: string;
}): MessageBridgeAction => {
  if (!senderOrigin) return 'drop';
  if (bridgeOrigin && senderOrigin === bridgeOrigin) return 'forward';
  if (allowedNavigationOrigin && senderOrigin === allowedNavigationOrigin) {
    return 'rekey';
  }
  return 'drop';
};
