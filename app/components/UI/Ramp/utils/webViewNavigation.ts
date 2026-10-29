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

export const createRampShouldStartLoadWithRequest =
  (callbackBaseUrl?: string) =>
  ({ url }: ShouldStartLoadRequest): boolean =>
    isRampWebViewNavigationAllowed(url, callbackBaseUrl);
