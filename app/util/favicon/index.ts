import Logger from '../Logger';
import { DOMParser } from '@xmldom/xmldom';
import { store } from '../../store';
import { storeFavicon } from '../../actions/browser';
import isUrl from 'is-url';
import { isNumber } from 'lodash';
import { ImageSourcePropType } from 'react-native';
import AppConstants from '../../../app/core/AppConstants';

export const FAVICON_FETCH_TIMEOUT_MS = 5000;
export const MAX_FAVICON_HTML_LENGTH = 256 * 1024;
export const MAX_FAVICON_URL_LENGTH = 8192;

const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];
const HEADERS_RECEIVED = 2;

const isHtmlContentType = (contentType: string | null) => {
  // tolerate a missing header, the size cap still applies
  if (!contentType) return true;
  const mimeType = contentType.split(';')[0].trim().toLowerCase();
  return HTML_CONTENT_TYPES.includes(mimeType);
};

/**
 * Returns true if the favicon URL can be safely rendered and stored:
 * http(s) or data:image URLs with a bounded length
 * @param faviconUrl - the favicon URL
 */
export const isSafeFaviconUrl = (faviconUrl: string | undefined) => {
  if (!faviconUrl || faviconUrl.length > MAX_FAVICON_URL_LENGTH) return false;
  const lowerCaseUrl = faviconUrl.toLowerCase();
  return (
    lowerCaseUrl.startsWith('https://') ||
    lowerCaseUrl.startsWith('http://') ||
    lowerCaseUrl.startsWith('data:image/')
  );
};

/**
 * Fetches the HTML source of the origin.
 * The request is aborted after FAVICON_FETCH_TIMEOUT_MS, when the response is not HTML,
 * or as soon as more than MAX_FAVICON_HTML_LENGTH bytes are received.
 * XMLHttpRequest is used instead of fetch because React Native's fetch
 * can only read the full body, while XHR progress events allow aborting early.
 * @param url - the origin URL
 * @returns - the HTML source
 */
const fetchHtmlSource = (url: URL): Promise<string | undefined> =>
  new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let headersChecked = false;

    const timeoutId = setTimeout(
      () => finish(undefined, 'timeout'),
      FAVICON_FETCH_TIMEOUT_MS,
    );

    function finish(htmlSource?: string, abortReason?: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (abortReason) {
        Logger.log(
          `favicon fetchHtmlSource aborted for ${url.origin}: ${abortReason}`,
        );
        xhr.abort();
      }
      resolve(htmlSource);
    }

    const isTooLarge = (receivedLength: number) =>
      receivedLength > MAX_FAVICON_HTML_LENGTH;

    const checkHeaders = () => {
      if (headersChecked || xhr.readyState < HEADERS_RECEIVED) return;
      headersChecked = true;
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(undefined, `status ${xhr.status}`);
        return;
      }
      if (!isHtmlContentType(xhr.getResponseHeader('Content-Type'))) {
        finish(undefined, 'not an HTML response');
        return;
      }
      const contentLength = Number(xhr.getResponseHeader('Content-Length'));
      if (isTooLarge(contentLength)) {
        finish(undefined, 'response too large');
      }
    };

    xhr.onreadystatechange = () => {
      checkHeaders();
    };
    xhr.onprogress = (event: ProgressEvent) => {
      checkHeaders();
      if (isTooLarge(event.loaded)) {
        finish(undefined, 'response too large');
      }
    };
    xhr.onload = () => {
      checkHeaders();
      if (settled) return;
      const htmlSource = xhr.responseText;
      if (isTooLarge(htmlSource?.length ?? 0)) {
        finish(undefined, 'response too large');
        return;
      }
      finish(htmlSource);
    };
    xhr.onerror = () => finish();
    xhr.onabort = () => finish();
    xhr.ontimeout = () => finish();

    try {
      xhr.open('GET', url.toString());
      // same as fetch credentials: 'omit'
      xhr.withCredentials = false;
      xhr.setRequestHeader('Accept', HTML_CONTENT_TYPES.join(','));
      xhr.send();
    } catch (e) {
      Logger.log(`favicon fetchHtmlSource failed for ${url.origin}`, e);
      finish();
    }
  });

/**
 * Parses the HTML source into a DOM document
 * @param htmlSource - the HTML source
 * @returns - the DOM document
 */
const parseHtmlSource = async (htmlSource: string | undefined) => {
  if (htmlSource && htmlSource.length > 0) {
    // use a return statement for the error handler to avoid the console warning
    // as any error will result in fallback favicon
    return new DOMParser({
      errorHandler: (level, msg) => {
        if (level === 'error') Logger.log(level, msg);
      },
    }).parseFromString(htmlSource, 'text/html');
  }
};

const toSafeFaviconUrl = (href: string, origin: URL) => {
  if (href.length > MAX_FAVICON_URL_LENGTH) return;
  try {
    const faviconURL = new URL(href, origin);
    return isSafeFaviconUrl(faviconURL.toString()) ? faviconURL : undefined;
  } catch (e) {
    return;
  }
};

/**
 * Returns the favicon URL from the HTML links collection
 * @param links - the HTML links collection
 * @param origin - the origin URL to be used to build the favicon url
 * @returns - the first found safe favicon URL or undefined if none found
 */
const getFaviconUrlFromLinks = (
  links: HTMLCollectionOf<Element> | undefined,
  origin: URL,
): URL | undefined => {
  let faviconURL: URL | undefined;

  if (links && links.length > 0 && origin) {
    Array.from(links).every((link) => {
      const rel = link.getAttribute('rel');
      if (rel?.split(' ').includes('icon')) {
        const href = link.getAttribute('href');
        faviconURL = href ? toSafeFaviconUrl(href, origin) : undefined;
        if (faviconURL) {
          return false; //stop loop at first favicon found, same behaviour as browser extension
        }
      }
      return true;
    });
  }
  return faviconURL;
};

/**
 * Returns a URL object from the given origin even if it's not a valid URL
 * @param origin the origin string (ie: 'metamask.github.io' or full dapp URL 'https://metamask.github.io/test-dapp/')
 */
const originToUrl = (origin: string) => {
  if (origin) {
    try {
      // remove sdk origin prefix before conversion
      const originWithoutPrefix = origin.replace(
        AppConstants.MM_SDK.SDK_REMOTE_ORIGIN,
        '',
      );
      const originWithProtocol = isUrl(originWithoutPrefix)
        ? originWithoutPrefix
        : `https://${originWithoutPrefix}`;
      return new URL(originWithProtocol);
    } catch (e) {
      Logger.log(`Can not convert ${origin} origin to URL`, e);
    }
  }
};

const originToHost = (origin: string) => {
  const normalisedOrigin = originToUrl(origin);
  if (normalisedOrigin) {
    return normalisedOrigin.host;
  }
};

/**
 * Writes the favicon URL from the given origin in the browser state
 * @param originUrl - the origin used as cache key
 * @param faviconUrl - the stored favicon url. Will not cache if this is undefined.
 */
export const cacheFavicon = (
  originUrl: string,
  faviconUrl: URL | undefined,
) => {
  if (!faviconUrl || !isSafeFaviconUrl(faviconUrl.toString())) return;
  const cacheKey = originToHost(originUrl);
  if (!cacheKey) return;
  store?.dispatch(
    storeFavicon({ origin: cacheKey, url: faviconUrl?.toString() }),
  );
};

/**
 * Reads the favicon URL for the given origin from the browser state
 * @param originUrl  -the origin used as cache key
 * @returns - the favicon url or null if none found
 */
export const getFaviconFromCache = (originUrl: string): string | undefined => {
  const cacheKey = originToHost(originUrl);
  if (!cacheKey) return;
  const { browser } = store.getState();
  const cachedFavicon = browser.favicons.find(
    (favicon: { origin: string; url: string }) => favicon.origin === cacheKey,
  );
  return isSafeFaviconUrl(cachedFavicon?.url) ? cachedFavicon.url : undefined;
};

const pendingFaviconLookups = new Map<string, Promise<URL | undefined>>();

const lookupFaviconURL = async (pageUrl: URL) => {
  const htmlSource = await fetchHtmlSource(pageUrl);
  const htmlDoc = await parseHtmlSource(htmlSource);
  const links = htmlDoc?.getElementsByTagName('link');
  return getFaviconUrlFromLinks(links, pageUrl);
};

/**
 * Returns URL for the favicon of the given url
 *
 * @param origin - String corresponding to website url or domain
 * @returns - URL corresponding to favicon url or empty string if none found
 *
 */
export const getFaviconURLFromHtml = async (origin: string) => {
  // in case the url of origin can not be reached, state stores the 'null' string
  // which is not a valid url, so until we take the time to fix this, we return empty string
  if (!origin || origin === 'null') {
    return;
  }
  const url = originToUrl(origin);
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    return;
  }
  // only the site root is fetched, the favicon cache is keyed by host anyway
  const pageUrl = new URL('/', url.origin);
  const pendingLookup = pendingFaviconLookups.get(pageUrl.origin);
  if (pendingLookup) return pendingLookup;

  const lookup = lookupFaviconURL(pageUrl).finally(() => {
    pendingFaviconLookups.delete(pageUrl.origin);
  });
  pendingFaviconLookups.set(pageUrl.origin, lookup);
  return lookup;
};

/**
 * Returns the favicon URL from the image source if it is an SVG image
 * @param imageSource the image source
 */
export const isFaviconSVG = (imageSource: ImageSourcePropType) => {
  if (
    imageSource &&
    !isNumber(imageSource) &&
    'uri' in imageSource &&
    (imageSource.uri?.endsWith('.svg') ||
      imageSource.uri?.startsWith('data:image/svg+xml'))
  ) {
    return imageSource.uri;
  }
};
