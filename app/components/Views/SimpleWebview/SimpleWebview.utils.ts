const ALLOWED_PROTOCOLS = ['https:', 'http:'];
const ALLOWED_ABOUT_URLS = ['about:blank', 'about:srcdoc'];

const parseUrl = (url?: unknown): URL | undefined => {
  if (typeof url !== 'string' || !url) {
    return undefined;
  }
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

/**
 * SimpleWebview has no address bar, phishing check or deeplink prompt, so it
 * only loads web pages and never hands other schemes to the OS.
 */
export const isAllowedSimpleWebviewUrl = (url?: unknown): boolean => {
  if (typeof url === 'string' && ALLOWED_ABOUT_URLS.includes(url)) {
    return true;
  }
  const parsed = parseUrl(url);
  return Boolean(
    parsed && ALLOWED_PROTOCOLS.includes(parsed.protocol) && parsed.hostname,
  );
};

export const getSimpleWebviewHostname = (url?: unknown): string => {
  const parsed = parseUrl(url);
  return parsed && ALLOWED_PROTOCOLS.includes(parsed.protocol)
    ? parsed.hostname
    : '';
};

export const onSimpleWebviewShouldStartLoad = ({
  url,
}: {
  url: string;
}): boolean => isAllowedSimpleWebviewUrl(url);
