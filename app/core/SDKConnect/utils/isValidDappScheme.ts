const DAPP_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*$/;
const BLOCKED_DAPP_SCHEMES = [
  'http',
  'https',
  'metamask',
  'javascript',
  'data',
  'file',
  'about',
  'blob',
];

/**
 * A dapp return scheme must be a bare custom URL scheme (RFC 3986), never a
 * web/browser scheme that would leak responses to a remote host or back into
 * the wallet.
 */
const isValidDappScheme = (scheme?: string): scheme is string =>
  !!scheme &&
  DAPP_SCHEME_REGEX.test(scheme) &&
  !BLOCKED_DAPP_SCHEMES.includes(scheme.toLowerCase());

export default isValidDappScheme;
