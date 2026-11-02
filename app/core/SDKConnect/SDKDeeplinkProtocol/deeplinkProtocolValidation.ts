import { OriginatorInfo } from '@metamask/sdk-communication-layer';

const MAX_DAPP_SCHEME_LENGTH = 64;
const DAPP_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*$/;

/**
 * Schemes that would hand the wallet's reply to a web server, the browser or
 * another wallet handler instead of the dapp's own app.
 */
const BLOCKED_DAPP_SCHEMES = [
  'http',
  'https',
  'ws',
  'wss',
  'ftp',
  'file',
  'data',
  'blob',
  'about',
  'javascript',
  'vbscript',
  'mailto',
  'tel',
  'sms',
  'metamask',
  'ethereum',
  'dapp',
  'wc',
];

/**
 * True when `scheme` is a plain custom URL scheme (e.g. `mydapp`) that can be
 * used to build `${scheme}://mmsdk?message=...` callbacks.
 */
export const isValidDappScheme = (scheme?: unknown): scheme is string =>
  typeof scheme === 'string' &&
  scheme.length <= MAX_DAPP_SCHEME_LENGTH &&
  DAPP_SCHEME_PATTERN.test(scheme) &&
  !BLOCKED_DAPP_SCHEMES.includes(scheme.toLowerCase());

const OPTIONAL_STRING_FIELDS = [
  'platform',
  'dappId',
  'icon',
  'source',
  'apiVersion',
  'connector',
] as const;

const toWebOrigin = (url: string): string | undefined => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return undefined;
    }
    return urlObj.origin;
  } catch (e) {
    return undefined;
  }
};

const isSafeIcon = (icon: string) =>
  icon.startsWith('https://') || icon.startsWith('data:image/');

/**
 * Decodes and validates the base64 `originatorInfo` of an SDK deeplink-protocol
 * connect link (`{ originatorInfo: {...} }`). The values are self-reported by
 * whoever opened the link, so the url is reduced to its http(s) origin and
 * icons that are not https or inline images are dropped.
 *
 * @throws if the payload is not valid JSON or does not describe a web dapp.
 */
export const parseDeeplinkOriginatorInfo = (
  base64OriginatorInfo: string,
): OriginatorInfo => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      Buffer.from(base64OriginatorInfo, 'base64').toString('utf-8'),
    );
  } catch (e) {
    throw new Error('Invalid originatorInfo encoding');
  }

  const info = (parsed as { originatorInfo?: unknown } | null)?.originatorInfo;
  if (typeof info !== 'object' || info === null || Array.isArray(info)) {
    throw new Error('Invalid originatorInfo structure');
  }

  const raw = info as Record<string, unknown>;
  if (typeof raw.url !== 'string' || typeof raw.title !== 'string') {
    throw new Error('Invalid originatorInfo structure');
  }

  const origin = toWebOrigin(raw.url);
  if (!origin) {
    throw new Error('Invalid originatorInfo url');
  }

  const sanitized: Record<string, string> = {
    url: origin,
    title: raw.title,
  };
  OPTIONAL_STRING_FIELDS.forEach((field) => {
    const value = raw[field];
    if (value === undefined) {
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('Invalid originatorInfo structure');
    }
    if (field === 'icon' && !isSafeIcon(value)) {
      return;
    }
    sanitized[field] = value;
  });

  return sanitized as unknown as OriginatorInfo;
};
