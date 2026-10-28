const SCHEME_REGEX = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Returns the PermissionController subject for a page loaded in the in-app browser.
 *
 * Grants were historically keyed by bare hostname. That key is kept for
 * `https://` pages on the default port so existing grants keep working, but any
 * other web origin (plain `http://`, or a non-default port) is keyed by its full
 * origin, e.g. `http://dapp.example` or `https://dapp.example:8443`. A page
 * served over another scheme or port therefore never inherits the grants of the
 * `https://` site on the same hostname.
 *
 * @param url - The page URL (or origin).
 * @returns The permission subject for the URL.
 */
export const getPermissionSubjectFromUrl = (url: string): string => {
  if (!url) return url;
  let parsed: URL;
  try {
    parsed = new URL(SCHEME_REGEX.test(url) ? url : `https://${url}`);
  } catch {
    return url;
  }
  const { protocol, hostname, port } = parsed;
  if (protocol === 'https:' && port === '') return hostname;
  if (protocol === 'https:' || protocol === 'http:') {
    return `${protocol}//${parsed.host}`;
  }
  return hostname || url;
};
