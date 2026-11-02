import Logger from '../Logger';
import { DOMParser } from '@xmldom/xmldom';
import { store } from '../../store';
import { storeFavicon } from '../../actions/browser';
import isUrl from 'is-url';
import { isNumber } from 'lodash';
import { ImageSourcePropType } from 'react-native';
import AppConstants from '../../../app/core/AppConstants';

/** How long an origin without a `<link rel="icon">` is remembered as a miss */
export const FAVICON_MISS_TTL_MS = 24 * 60 * 60 * 1000;
/** How long an origin whose HTML could not be fetched is remembered as a miss */
export const FAVICON_FETCH_ERROR_TTL_MS = 60 * 60 * 1000;

interface FaviconCacheEntry {
  origin: string;
  url: string;
  expiresAt?: number;
}

interface FaviconLookupResult {
  faviconUrl?: URL;
  fetchFailed: boolean;
}

const inFlightFaviconRequests = new Map<string, Promise<string | undefined>>();

/**
 * Fetches the HTML source of the origin
 * @param url - the origin URL
 * @returns - the HTML source, or undefined if the request failed or was not OK
 */
const fetchHtmlSource = async (url: URL) => {
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (response?.ok) {
      return await response.text();
    }
  } catch (e) {
    await Logger.log(`favicon fetchHtmlSource failed for ${url}`, e);
  }
};

const RAW_TEXT_ELEMENT = /^<(script|style|title|textarea|noscript)[\s/>]/i;
const HEAD_BOUNDARY = /^(<\/head\s*>|<body[\s/>])/i;

/**
 * Finds where `<head>` really ends, skipping comments and raw-text elements
 * (such as scripts) whose content can contain `</head>` as plain text
 * @param htmlSource - the HTML source
 * @returns - the boundary index, or -1 when it cannot be identified safely
 */
const findHeadEnd = (htmlSource: string) => {
  const lowerSource = htmlSource.toLowerCase();
  let index = htmlSource.indexOf('<');
  while (index !== -1) {
    const rest = htmlSource.slice(index, index + 32);
    if (rest.startsWith('<!--')) {
      const commentEnd = htmlSource.indexOf('-->', index + 4);
      if (commentEnd === -1) return -1;
      index = commentEnd + 3;
    } else if (HEAD_BOUNDARY.test(rest)) {
      return index;
    } else {
      const rawText = RAW_TEXT_ELEMENT.exec(rest);
      if (rawText) {
        const closeIndex = lowerSource.indexOf(
          `</${rawText[1].toLowerCase()}`,
          index + rawText[0].length,
        );
        if (closeIndex === -1) return -1;
        index = closeIndex + 2;
      } else {
        index += 1;
      }
    }
    index = htmlSource.indexOf('<', index);
  }
  return -1;
};

/**
 * Keeps only the document up to the end of `<head>`, where icon links live,
 * so the body is not parsed on the JS thread. The whole document is kept when
 * the end of `<head>` cannot be identified safely.
 * @param htmlSource - the HTML source
 */
const truncateAfterHead = (htmlSource: string) => {
  const headEnd = findHeadEnd(htmlSource);
  if (headEnd === -1) return htmlSource;
  return `${htmlSource.slice(0, headEnd)}</head></html>`;
};

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
    }).parseFromString(truncateAfterHead(htmlSource), 'text/html');
  }
};

/**
 * Returns the favicon URL from the HTML links collection
 * @param links - the HTML links collection
 * @param origin - the origin URL to be used to build the favicon url
 * @returns - the first found favicon URL or empty object if none found
 */
const getFaviconUrlFromLinks = (
  links: HTMLCollectionOf<Element> | undefined,
  origin: URL,
): URL | undefined => {
  let faviconURL;

  if (links && links.length > 0 && origin) {
    Array.from(links).every((link) => {
      const rel = link.getAttribute('rel');
      if (rel?.split(' ').includes('icon')) {
        const href = link.getAttribute('href');
        if (href) {
          try {
            faviconURL = new URL(href, origin);
            return false; //stop loop at first favicon found, same behaviour as browser extension
          } catch (e) {
            Logger.log(`Ignoring invalid favicon href ${href}`, e);
          }
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
  if (!faviconUrl) return;
  const cacheKey = originToHost(originUrl);
  if (!cacheKey) return;
  store?.dispatch(
    storeFavicon({ origin: cacheKey, url: faviconUrl?.toString() }),
  );
};

/**
 * Cache key for misses: scoped to the fetched page (without query or hash),
 * since one page lacking an icon link says nothing about other pages of the host
 * @param url - the fetched page URL
 */
const missCacheKey = (url: URL) => `${url.origin}${url.pathname}`;

/**
 * Remembers that the given page has no usable favicon until the TTL expires,
 * so the fallback icon is used without fetching the page again
 * @param originUrl - the fetched origin or page URL
 * @param ttlMs - how long the miss stays valid
 */
export const cacheFaviconMiss = (
  originUrl: string,
  ttlMs: number = FAVICON_MISS_TTL_MS,
) => {
  const url = originToUrl(originUrl);
  if (!url) return;
  store?.dispatch(
    storeFavicon({
      origin: missCacheKey(url),
      url: '',
      expiresAt: Date.now() + ttlMs,
    }),
  );
};

const findUnexpiredCacheEntry = (
  cacheKey: string,
): FaviconCacheEntry | undefined => {
  const { browser } = store.getState();
  const cachedFavicon: FaviconCacheEntry | undefined = browser.favicons.find(
    (favicon: FaviconCacheEntry) => favicon.origin === cacheKey,
  );
  if (
    cachedFavicon?.expiresAt !== undefined &&
    cachedFavicon.expiresAt <= Date.now()
  ) {
    return;
  }
  return cachedFavicon;
};

/**
 * Reads the favicon URL for the given origin from the browser state
 * @param originUrl  -the origin used as cache key
 * @returns - the favicon url or undefined if none found
 */
export const getFaviconFromCache = (originUrl: string): string | undefined => {
  const cacheKey = originToHost(originUrl);
  if (!cacheKey) return;
  return findUnexpiredCacheEntry(cacheKey)?.url || undefined;
};

const lookupFaviconFromHtml = async (
  url: URL,
): Promise<FaviconLookupResult> => {
  try {
    const htmlSource = await fetchHtmlSource(url);
    if (htmlSource === undefined) return { fetchFailed: true };
    const htmlDoc = await parseHtmlSource(htmlSource);
    const links = htmlDoc?.getElementsByTagName('link');
    return {
      faviconUrl: getFaviconUrlFromLinks(links, url),
      fetchFailed: false,
    };
  } catch (e) {
    await Logger.log(`favicon lookup failed for ${url}`, e);
    return { fetchFailed: true };
  }
};

/**
 * Returns URL for the favicon of the given url
 *
 * @param origin - String corresponding to website url or domain
 * @returns - URL corresponding to favicon url or undefined if none found
 *
 */
export const getFaviconURLFromHtml = async (origin: string) => {
  // in case the url of origin can not be reached, state stores the 'null' string
  // which is not a valid url, so until we take the time to fix this, we return empty string
  if (!origin || origin === 'null') {
    return;
  }
  const url = originToUrl(origin);
  if (url) {
    return (await lookupFaviconFromHtml(url)).faviconUrl;
  }
};

/**
 * Returns the favicon URL for the given origin, using the cache first.
 * Hits are cached per host and misses per page, and concurrent calls for the
 * same page share a single fetch.
 *
 * @param origin - String corresponding to website url or domain
 * @returns - the favicon url or undefined to use the fallback icon
 */
export const resolveFavicon = async (
  origin: string,
): Promise<string | undefined> => {
  if (!origin || origin === 'null') return;
  const url = originToUrl(origin);
  if (!url) return;

  const cachedFaviconUrl = getFaviconFromCache(origin);
  if (cachedFaviconUrl) return cachedFaviconUrl;

  const cacheKey = missCacheKey(url);
  if (findUnexpiredCacheEntry(cacheKey)) return;

  const pending = inFlightFaviconRequests.get(cacheKey);
  if (pending) return pending;

  const request = (async () => {
    const { faviconUrl, fetchFailed } = await lookupFaviconFromHtml(url);
    if (faviconUrl) {
      cacheFavicon(origin, faviconUrl);
      return faviconUrl.toString();
    }
    cacheFaviconMiss(
      origin,
      fetchFailed ? FAVICON_FETCH_ERROR_TTL_MS : FAVICON_MISS_TTL_MS,
    );
    return undefined;
  })().finally(() => {
    inFlightFaviconRequests.delete(cacheKey);
  });
  inFlightFaviconRequests.set(cacheKey, request);
  return request;
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
