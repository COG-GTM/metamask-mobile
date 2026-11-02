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
 * Origins allowed to receive the homepage scripts (bookmarks, analytics ID)
 */
export const getHomepageOrigins = (): string[] => [
  new URLParse(AppConstants.HOMEPAGE_URL).origin,
  `https://${AppConstants.OLD_HOMEPAGE_URL_HOST}`,
];

/**
 * Builds the script that exposes the user's favorites and analytics settings
 * to the homepage. The script checks `window.location.origin` (unforgeable)
 * of the document it runs in, so it is a no-op if `injectJavaScript` lands in
 * any other page, e.g. the page that started navigating to the homepage.
 * Only `===` comparisons are used before the check passes, so a hostile page
 * cannot subvert it by patching prototypes.
 */
export const buildHomepageScripts = ({
  bookmarks,
  searchEngine,
  analyticsEnabled,
  distinctId,
  mixpanelToken,
  allowedOrigins = getHomepageOrigins(),
}: {
  bookmarks: unknown;
  searchEngine?: string;
  analyticsEnabled: boolean;
  distinctId?: string;
  mixpanelToken?: string;
  allowedOrigins?: string[];
}): string => {
  const originCheck = allowedOrigins
    .map((origin) => `__mmOrigin !== ${JSON.stringify(origin)}`)
    .join(' && ');
  return `
(function () {
  var __mmOrigin = window.location.origin;
  if (${originCheck || 'true'}) {
    return;
  }
  window.__mmFavorites = ${JSON.stringify(bookmarks ?? [])};
  window.__mmSearchEngine = ${JSON.stringify(searchEngine ?? '')};
  window.__mmMetametrics = ${JSON.stringify(Boolean(analyticsEnabled))};
  window.__mmDistinctId = ${JSON.stringify(distinctId ?? '')};
  window.__mmMixpanelToken = ${JSON.stringify(mixpanelToken ?? '')};
  try {
    window.dispatchEvent(new Event('metamask_onHomepageScriptsInjected'));
  } catch (e) {
    // Nothing to do
  }
})();
true;
`;
};
