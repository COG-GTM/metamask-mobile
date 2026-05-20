import Device from '../device';
import { strings } from '../../../locales/i18n';

/**
 * Returns a string with the first letter in lower case
 *
 * @param {string} str - String to lowercase the first letter
 * @returns {string} - String with the first letter in lower case
 */
export function tlc(str: string): string {
  if (!str) return str;
  return str.substr(0, 1).toLowerCase() + str.substr(1);
}

export async function timeoutFetch(url: string, options?: RequestInit, timeout = 500): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout),
    ),
  ]);
}

interface NavigatorState {
  routes?: NavigatorState[];
  routeName?: string;
  name?: string;
  state?: NavigatorState;
  index?: number;
}

export function findRouteNameFromNavigatorState(routes: NavigatorState[]): string | undefined {
  let route: NavigatorState | undefined = routes?.[routes.length - 1];
  if (route?.state) {
    route = route.state;
  }
  while (route?.routes) {
    route = route.routes[route.index ?? route.routes.length - 1];
    if (route?.state) {
      route = route.state;
      continue;
    }
  }
  return route?.name;
}

/**
 * Returns the first letter of a string in upper case
 *
 * @param {string} str - String to capitalize
 * @returns {string} - String with the first letter in upper case
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if two strings are equal ignoring case
 *
 * @param {string} value1 - First string
 * @param {string} value2 - Second string
 * @returns {boolean} - Whether the two strings are equal ignoring case
 */
export function toLowerCaseEquals(value1: string | null | undefined, value2: string | null | undefined): boolean {
  if (!value1 && !value2) return true;
  if (!value1 || !value2) return false;
  return value1.toLowerCase() === value2.toLowerCase();
}

/**
 * Performs a shallow equality check between two objects
 *
 * @param {Object} objA - First object
 * @param {Object} objB - Second object
 * @returns {boolean} - Whether the two objects are shallowly equal
 */
export function shallowEqual(objA: Record<string, unknown>, objB: Record<string, unknown>): boolean {
  if (objA === objB) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Renders a short text for display, trimming based on device size
 * @param {string} text - text to render
 * @param {number} chars - number of characters to render
 * @returns {string} - short text
 */
export function renderShortText(text: string, chars?: number): string | undefined {
  if (typeof text !== 'string') return undefined;
  if (Device.isSmallDevice()) {
    return `${text.substr(0, chars || 4)}...`;
  } else if (Device.isMediumDevice()) {
    return `${text.substr(0, chars || 8)}...`;
  }
  return text;
}

/**
 * Returns the url protocol
 *
 * @param {string} url - Url to get the protocol of
 * @returns {string} - Protocol of the url
 */
export function getURLProtocol(url: string): string {
  const urlObj = new URL(url);
  return urlObj.protocol;
}

/**
 * Checks if a url is an IPFS URI
 *
 * @param {string} uri - URI to check
 * @returns {boolean} - Whether the URI is an IPFS URI
 */
export function isIPFSUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return uri.startsWith('ipfs://');
}

/**
 * Deep JSON parse
 *
 * @param {string} str - String to parse
 * @returns {object} - Parsed JSON object
 */
export const deepJSONParse = (str: string): unknown => {
  let parsed = JSON.parse(str);
  if (typeof parsed === 'string') parsed = deepJSONParse(parsed);
  return parsed;
};

/**
 * Returns unique list of items based on a key
 *
 * @param {Array} list - List of items
 * @param {string} key - Key to use for uniqueness
 * @returns {Array} - Unique list of items
 */
export function getUniqueList<T extends Record<string, unknown>>(list: T[], key: string): T[] {
  const seen = new Set<unknown>();
  return list.filter((item) => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}
