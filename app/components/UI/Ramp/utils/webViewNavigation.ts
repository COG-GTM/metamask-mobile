import { ShouldStartLoadRequest } from '@metamask/react-native-webview/lib/WebViewTypes';

const ALLOWED_SCHEMES = ['http', 'https'];
const ALLOWED_ABOUT_URLS = ['about:blank', 'about:srcdoc'];

/**
 * The WebView forwards any URL outside `originWhitelist` to `Linking.openURL`
 * before `onShouldStartLoadWithRequest` runs, so the whitelist must let every
 * URL through and the scheme check must happen in the handler instead.
 */
export const RAMP_WEBVIEW_ORIGIN_WHITELIST = ['*'];

const getScheme = (url: string) =>
  /^([a-z][a-z0-9+.-]*):/i.exec(url.trim())?.[1]?.toLowerCase();

/**
 * Whether a ramp provider WebView may load `url`. Only http(s), blank/srcdoc
 * frames and the ramp callback are allowed; any other scheme is blocked so it
 * is never handed to another app.
 *
 * @param url - The URL the WebView is about to load.
 * @param callbackBaseUrl - The ramp callback URL prefix to allow.
 * @returns True if the navigation may proceed.
 */
export const isRampWebViewNavigationAllowed = (
  url: string,
  callbackBaseUrl?: string,
): boolean => {
  if (callbackBaseUrl && url.startsWith(callbackBaseUrl)) {
    return true;
  }
  if (ALLOWED_ABOUT_URLS.includes(url.trim().toLowerCase())) {
    return true;
  }
  const scheme = getScheme(url);
  return scheme !== undefined && ALLOWED_SCHEMES.includes(scheme);
};

/**
 * Builds an `onShouldStartLoadWithRequest` handler for ramp provider WebViews.
 * Use together with `RAMP_WEBVIEW_ORIGIN_WHITELIST`.
 *
 * @param callbackBaseUrl - The ramp callback URL prefix to allow.
 * @returns A handler that returns false for disallowed navigations.
 */
export const createRampShouldStartLoadWithRequest =
  (callbackBaseUrl?: string) =>
  ({ url }: ShouldStartLoadRequest): boolean =>
    isRampWebViewNavigationAllowed(url, callbackBaseUrl);
