const DAPP_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]{0,63}$/i;

// Schemes that would let a deeplink turn the SDK callback into a web
// redirect, a system action or a re-entry into a wallet handler.
const BLOCKED_DAPP_SCHEMES = new Set([
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
  'tel',
  'telprompt',
  'sms',
  'mailto',
  'facetime',
  'facetime-audio',
  'itms',
  'itms-apps',
  'itms-services',
  'app-settings',
  'metamask',
  'ethereum',
  'wc',
  'dapp',
]);

export const isValidDappScheme = (scheme: unknown): scheme is string =>
  typeof scheme === 'string' &&
  DAPP_SCHEME_PATTERN.test(scheme) &&
  !BLOCKED_DAPP_SCHEMES.has(scheme.toLowerCase());
