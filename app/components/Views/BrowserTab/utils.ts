import AppConstants from '../../../core/AppConstants';
import URLParse from 'url-parse';
import { SessionENSNames } from './types';
import { HOMEPAGE_HOST, OLD_HOMEPAGE_URL_HOST } from './constants';
import { prefixUrlWithProtocol } from '../../../util/browser';

export const HOMEPAGE_HOSTS: string[] = [HOMEPAGE_HOST, OLD_HOMEPAGE_URL_HOST];

/**
 * Checks if a url is served from an allowed homepage origin (https only)
 *
 * @param url - The url to check. Urls without a protocol are treated as https.
 * @returns - True if the url is an https url on a homepage host
 */
export const isHomepageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const { protocol, host } = new URLParse(prefixUrlWithProtocol(url));
  return protocol === 'https:' && HOMEPAGE_HOSTS.includes(host);
};

/**
 * Wraps a script so it only runs if the document currently loaded in the
 * WebView is an allowed homepage origin
 *
 * @param script - The script to guard
 * @returns - The guarded script
 */
export const guardScriptToHomepageOrigin = (script: string): string => `
(function () {
  var homepageHosts = ${JSON.stringify(HOMEPAGE_HOSTS)};
  if (
    window.location.protocol !== 'https:' ||
    homepageHosts.indexOf(window.location.host) === -1
  ) {
    return;
  }
  ${script}
})();
`;

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
