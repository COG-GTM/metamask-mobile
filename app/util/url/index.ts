import AppConstants from '../../core/AppConstants';

/**
 * "Use require('punycode/') to import userland modules rather than core modules."
 * {@see {@link https://github.com/mathiasbynens/punycode.js?tab=readme-ov-file#installation}
 */
import { toASCII } from 'punycode/';

const hostnameRegex =
  /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)?(?:www\.)?([^/?:]+)(?::\d+)?/;

export function isPortfolioUrl(url: string) {
  try {
    const currentUrl = new URL(url);
    return currentUrl.origin === AppConstants.PORTFOLIO.URL;
  } catch (error) {
    return false;
  }
}

export function isBridgeUrl(url: string) {
  try {
    const currentUrl = new URL(url);
    const bridgeUrl = new URL(AppConstants.BRIDGE.URL);

    return (
      currentUrl.origin === bridgeUrl.origin &&
      removePathTrailingSlash(currentUrl.pathname) ===
        removePathTrailingSlash(bridgeUrl.pathname)
    );
  } catch (error) {
    return false;
  }
}

/**
 * This method does not use the URL library because it does not support punycode encoding in react native.
 * It compares the original hostname to a punycode version of the hostname.
 */
export const isValidASCIIURL = (urlString?: string) => {
  if (!urlString || urlString.length === 0) {
    return false;
  }

  try {
    const originalHostname = urlString.match(hostnameRegex);
    const punycodeHostname = toASCII(originalHostname?.[1] || '');
    return originalHostname?.[1] === punycodeHostname;
  } catch (exp: unknown) {
    console.error(
      `Failed to detect if URL hostname contains non-ASCII characters: ${urlString}. Error: ${exp}`,
    );
    return false;
  }
};

function removePathTrailingSlash(path: string) {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Determines whether a hostname points at a private, loopback, link-local or
 * otherwise non-public address. Used to block SSRF-style egress to a victim's
 * LAN/localhost when fetching attacker-influenced resources.
 *
 * @param hostname - The hostname (may be a bracketed IPv6 literal)
 * @returns - True if the hostname is not a public host
 */
const isPrivateHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

  if (host === 'localhost' || host.endsWith('.localhost')) {
    return true;
  }

  // IPv6 loopback, unspecified, link-local (fe80::/10) and unique-local (fc00::/7)
  if (host.includes(':')) {
    if (host === '::1' || host === '::') {
      return true;
    }
    if (
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb') ||
      host.startsWith('fc') ||
      host.startsWith('fd')
    ) {
      return true;
    }
    return false;
  }

  // IPv4 private / loopback / link-local / unspecified ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  return false;
};

/**
 * Validates that a URI is safe to fetch/render as a remote SVG icon. Blocks
 * SSRF/local-file egress by only allowing http(s) URLs to public hosts (plus
 * inline data: URIs, which cause no network request).
 *
 * @param uri - The candidate SVG URI
 * @returns - True if the URI is safe to fetch
 */
export const isSafeSvgUri = (uri?: string): boolean => {
  if (!uri) {
    return false;
  }

  // Inline SVGs are rendered without any network egress.
  if (uri.startsWith('data:')) {
    return true;
  }

  try {
    const { protocol, hostname } = new URL(uri);
    if (protocol !== 'https:' && protocol !== 'http:') {
      return false;
    }
    if (!hostname || isPrivateHostname(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Note: We use the punycode library here because the URL library in react native doesn't support punycode encoding.
 * We do have the 'react-native-url-polyfill' package which supports the URL library, but it doesn't support punycode encoding.
 * The URL library is supported in node.js which allows tests to pass, but behavior differs in react-native runtime.
 */
export const toPunycodeURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    const punycodeUrl = toASCII(url.href);
    const isWithoutEndSlash = url.pathname === '/' && !urlString.endsWith('/');

    return isWithoutEndSlash ? punycodeUrl.slice(0, -1) : punycodeUrl;
  } catch (err: unknown) {
    console.error(`Failed to convert URL to Punycode: ${err}`);
    return urlString;
  }
};
