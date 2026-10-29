import URLParse from 'url-parse';

/**
 * Returns the permission subject (origin key) for a page loaded in the in-app browser.
 *
 * Secure pages on the default port keep the bare hostname so existing grants stay valid.
 * Any other scheme or an explicit port gets its full origin as key, so a page served over
 * plain http or on another port never inherits the permissions granted to the https site.
 *
 * @param url - URL of the page.
 * @returns The permission subject for the page.
 */
export const getBrowserPermissionSubject = (url: string): string => {
  const { protocol, host, hostname } = new URLParse(url);
  if (protocol === 'https:' && host === hostname) {
    return hostname;
  }
  return `${protocol}//${host}`;
};
