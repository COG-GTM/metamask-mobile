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
 * Returns the hostname a tab is leaving when it navigates from `previousUrl`
 * to `nextUrl`, or `undefined` if the host does not change or another tab is
 * still on that host. Pending approvals of that hostname should be rejected.
 *
 * @param params.previousUrl - URL the tab was on
 * @param params.nextUrl - URL the tab is moving to
 * @param params.tabId - Id of the navigating tab
 * @param params.tabs - All browser tabs
 * @returns - The hostname that was left
 */
export const getHostnameLeftByNavigation = ({
  previousUrl,
  nextUrl,
  tabId,
  tabs = [],
}: {
  previousUrl: string;
  nextUrl: string;
  tabId: number;
  tabs?: { id: number; url?: string }[];
}): string | undefined => {
  const previousHostname = new URLParse(previousUrl).hostname;
  if (!previousHostname || previousHostname === new URLParse(nextUrl).hostname)
    return undefined;

  const isOpenInOtherTab = tabs.some(
    (tab) =>
      tab.id !== tabId &&
      Boolean(tab.url) &&
      new URLParse(tab.url as string).hostname === previousHostname,
  );
  return isOpenInOtherTab ? undefined : previousHostname;
};
