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

// Dot segments, plus encoded separators/percents a gateway might decode into one.
const UNSAFE_PATH_REGEX = /%2f|%5c|%25|\\|(^|\/)(\.|%2e){1,2}(\/|$)/i;

/**
 * Finds the ENS name whose resolved content root (gateway + content hash, or
 * gateway + IPNS name) contains the given url.
 *
 * Path-based gateways serve every ENS site under the same hostname, so the
 * content root is what actually identifies the site.
 */
export const findSessionENSName = (
  url: string,
  sessionENSNames: SessionENSNames,
) => {
  if (!url) return undefined;
  const target = new URLParse(url);
  // Latest entry first, so the most recently resolved name wins.
  for (const [key, entry] of Object.entries(sessionENSNames).reverse()) {
    const marker = entry.type?.startsWith('ipns') ? entry.hostname : entry.hash;
    if (!marker) continue;
    const markerIndex = key.indexOf(marker);
    if (markerIndex === -1) continue;
    const root = new URLParse(key.slice(0, markerIndex + marker.length));
    if (
      !root.protocol ||
      target.protocol !== root.protocol ||
      target.host !== root.host
    ) {
      continue;
    }
    const rootPath = root.pathname;
    let rest: string;
    if (target.pathname === rootPath) {
      rest = '';
    } else if (target.pathname.startsWith(`${rootPath}/`)) {
      rest = target.pathname.slice(rootPath.length);
    } else {
      continue;
    }
    if (UNSAFE_PATH_REGEX.test(rest)) continue;
    return {
      ...entry,
      rest: `${rest || '/'}${target.query}${target.hash}`,
    };
  }
  return undefined;
};

/**
 * Returns the origin that wallet permissions for a url are keyed by.
 * Pages resolved from an ENS name use the ENS name rather than the gateway
 * host, so different ENS sites on the same gateway don't share permissions.
 */
export const getPermissionOriginUrl = (
  url: string,
  sessionENSNames: SessionENSNames,
) => {
  const ensName = findSessionENSName(url, sessionENSNames);
  if (ensName) return `https://${ensName.hostname}`;
  return new URLParse(url).origin;
};

/**
 * Hostname used as the permission subject for a url (see getPermissionOriginUrl)
 */
export const getPermissionHostname = (
  url: string,
  sessionENSNames: SessionENSNames,
) =>
  findSessionENSName(url, sessionENSNames)?.hostname ??
  new URLParse(url).hostname;

/**
 * Gets the url to be displayed to the user
 * For example, if it's ens then show [site].eth instead of ipfs url
 */
export const getMaskedUrl = (
  urlToMask: string,
  sessionENSNames: SessionENSNames,
) => {
  if (!urlToMask) return urlToMask;
  const ensName = findSessionENSName(urlToMask, sessionENSNames);
  if (!ensName) return urlToMask;
  return `https://${ensName.hostname}${ensName.rest}`;
};
