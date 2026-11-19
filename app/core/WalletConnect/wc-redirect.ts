import { PROTOCOLS } from '../../constants/deeplinks';

// Hosts the app claims as universal/app links (iOS entitlements, Android manifest).
const WALLET_UNIVERSAL_LINK_HOSTS = [
  'metamask.app.link',
  'metamask.test-app.link',
  'metamask.test.app.link',
  'metamask-alternate.app.link',
  'metamask-alternate.test-app.link',
  'metamask-alternate.test.app.link',
  'metamask.io',
  'link.metamask.io',
];

/** Parses a URL, returning undefined instead of throwing when invalid. */
const parseUrl = (value: string): URL | undefined => {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

/** Whether `host` equals `parentHost` or is one of its subdomains. */
const isSameOrSubdomain = (host: string, parentHost: string) =>
  host === parentHost || host.endsWith(`.${parentHost}`);

/**
 * Validates a WalletConnect peer redirect link before it is opened without a
 * prompt. Only https links back to the dApp's own host (or a subdomain) are
 * allowed; custom app schemes, wallet links and system schemes are rejected.
 */
export const isSafeWCRedirectLink = (
  link: string | undefined,
  peerUrl: string | undefined,
): boolean => {
  if (!link || typeof link !== 'string') return false;

  const url = parseUrl(link.trim());
  if (!url || url.protocol !== `${PROTOCOLS.HTTPS}:`) return false;

  const host = url.hostname.toLowerCase();
  if (!host || url.username || url.password) return false;
  if (WALLET_UNIVERSAL_LINK_HOSTS.includes(host)) return false;

  const peer = peerUrl ? parseUrl(peerUrl) : undefined;
  if (peer?.protocol !== `${PROTOCOLS.HTTPS}:`) return false;
  const peerHost = peer.hostname.toLowerCase();
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
