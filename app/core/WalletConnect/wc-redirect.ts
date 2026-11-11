import { PROTOCOLS } from '../../constants/deeplinks';

const WALLET_SCHEMES: string[] = [
  PROTOCOLS.METAMASK,
  PROTOCOLS.WC,
  PROTOCOLS.ETHEREUM,
  PROTOCOLS.DAPP,
  'expo-metamask',
];

// Hosts the app claims as universal/app links (iOS entitlements, Android manifest).
const WALLET_UNIVERSAL_LINK_HOSTS = [
  'metamask.app.link',
  'metamask.test-app.link',
  'metamask-alternate.app.link',
  'metamask-alternate.test-app.link',
  'metamask.io',
  'link.metamask.io',
];

const BLOCKED_SCHEMES = [
  'javascript',
  'vbscript',
  'data',
  'blob',
  'file',
  'about',
  'content',
  'intent',
  'http',
  'tel',
  'telprompt',
  'sms',
  'mailto',
  'facetime',
  'facetime-audio',
  'itms',
  'itms-apps',
  'itms-appss',
  'itms-services',
  'app-settings',
  'prefs',
  'app-prefs',
  'shortcuts',
];

const CUSTOM_SCHEME_REGEX = /^[a-z][a-z0-9+.-]*$/;

const parseUrl = (value: string): URL | undefined => {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

const isSameOrSubdomain = (host: string, parentHost: string) =>
  host === parentHost || host.endsWith(`.${parentHost}`);

/**
 * Validates a WalletConnect peer redirect link before it is opened.
 * Custom app schemes are allowed unless they belong to the wallet or are
 * system/script schemes; https links must point at the dApp's own host.
 */
export const isSafeWCRedirectLink = (
  link: string | undefined,
  peerUrl: string | undefined,
): boolean => {
  if (!link || typeof link !== 'string') return false;

  const url = parseUrl(link.trim());
  if (!url) return false;

  const scheme = url.protocol.replace(/:$/, '').toLowerCase();
  if (!CUSTOM_SCHEME_REGEX.test(scheme)) return false;
  if (WALLET_SCHEMES.includes(scheme)) return false;
  if (BLOCKED_SCHEMES.includes(scheme)) return false;
  if (scheme.startsWith('x-apple')) return false;

  if (scheme !== PROTOCOLS.HTTPS) return true;

  const host = url.hostname.toLowerCase();
  if (!host || url.username || url.password) return false;
  if (WALLET_UNIVERSAL_LINK_HOSTS.includes(host)) return false;

  const peer = peerUrl ? parseUrl(peerUrl) : undefined;
  const peerHost = peer?.hostname.toLowerCase();
  if (!peerHost) return false;

  return isSameOrSubdomain(host, peerHost);
};

/**
 * Returns the first peer redirect link (native, then universal) that passes
 * {@link isSafeWCRedirectLink}, or undefined if none do.
 */
export const getSafeWCRedirectLink = (
  redirect: { native?: string; universal?: string } | undefined,
  peerUrl: string | undefined,
): string | undefined =>
  [redirect?.native, redirect?.universal].find((link) =>
    isSafeWCRedirectLink(link, peerUrl),
  );
