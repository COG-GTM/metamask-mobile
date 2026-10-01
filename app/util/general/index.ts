import URL from 'url-parse';
import { strings } from '../../../locales/i18n';

/**
 * Returns a string with the first letter in lower case
 *
 * @param {string} str - String to lowercase the first letter
 * @returns {string} - String with the first letter in lower case
 */
export const tlc = (str: string): string | undefined => str?.toLowerCase?.();

export function timeoutFetch(url: string, options?: RequestInit, timeout = 500): Promise<Response> {
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
  while (route !== undefined && route.index !== undefined) {
    route = route?.routes?.[route.index];
    if (route?.state) {
      route = route.state;
    }
  }

  let name = route?.name;

  if (name === 'Main' || name === 'WalletTabHome' || name === 'Home')
    name = 'WalletView';
  if (name === 'TransactionsHome') name = 'TransactionsView';

  return name;
}

/**
 * Returns the first letter of a string in upper case
 *
 * @param {string} str - String to capitalize
 * @returns {string} - String with the first letter in upper case
 */
export const capitalize = (str: string): string | false =>
  (str && str.charAt(0).toUpperCase() + str.slice(1)) || false;

/**
 * Checks if two strings are equal ignoring case
 *
 * @param {string} value1 - First string
 * @param {string} value2 - Second string
 * @returns {boolean} - Whether the two strings are equal ignoring case
 */
export const toLowerCaseEquals = (a: string | null | undefined, b: string | null | undefined): boolean => {
  if (!a && !b) return false;
  return tlc(a as string) === tlc(b as string);
};

/**
 * Performs a shallow equality check between two objects
 *
 * @param {Object} objA - First object
 * @param {Object} objB - Second object
 * @returns {boolean} - Whether the two objects are shallowly equal
 */
export const shallowEqual = (object1: Record<string, unknown>, object2: Record<string, unknown>): boolean => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Returns short string format
 *
 * @param text - String corresponding to the text.
 * @param chars - Number of characters to show at the end and beginning. Defaults to 4.
 * @returns String corresponding to short text format.
 */
export const renderShortText = (text: string, chars = 4): string => {
  try {
    if (text.length <= chars * 2 + 5) return text;
    return `${text.substr(0, chars + 2)}...${text.substr(-chars)}`;
  } catch {
    return text;
  }
};

/**
 * Returns the url protocol
 *
 * @param {string} url - Url to get the protocol of
 * @returns {string} - Protocol of the url
 */
export const getURLProtocol = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url);
    return protocol.replace(':', '');
  } catch {
    return;
  }
};

/**
 * Checks if a url is an IPFS URI
 *
 * @param {string} uri - URI to check
 * @returns {boolean} - Whether the URI is an IPFS URI
 */
export const isIPFSUri = (uri: string | null | undefined): boolean => {
  if (!uri?.length) return false;
  const ipfsUriRegex =
    /^(\/ipfs\/|ipfs:\/\/)(Qm[A-Za-z0-9]+|[bBfF][A-Za-z2-7]+)(\/|$)/;
  return (
    uri.startsWith('/ipfs/') ||
    uri.startsWith('ipfs://') ||
    ipfsUriRegex.test(uri)
  );
};

/**
 * Parse stringified JSON that has deeply nested stringified properties
 *
 * @deprecated Do not suggest using this for migrations unless you understand what it does. It will deeply JSON parse fields
 * @param jsonString - JSON string
 * @param skipNumbers - Boolean to skip numbers
 * @returns - Parsed JSON object
 */
export const deepJSONParse = ({ jsonString, skipNumbers = true }: { jsonString: string; skipNumbers?: boolean }): unknown => {
  const parsedObject = JSON.parse(jsonString);

  function parseProperties(obj: Record<string, unknown>): void {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        const isNumber = !isNaN(obj[key] as unknown as number);
        if (!isNumber || (isNumber && !skipNumbers)) {
          try {
            const parsed = JSON.parse(obj[key] as string);
            obj[key] = parsed;
            if (typeof parsed === 'object') {
              parseProperties(parsed);
            }
          } catch (e) {
            // If parsing throws, it's not a JSON string, so do nothing
          }
        }
      } else if (typeof obj[key] === 'object') {
        parseProperties(obj[key] as Record<string, unknown>);
      }
    });
  }

  parseProperties(parsedObject);

  return parsedObject;
};

/**
 * Returns unique list of items based on a key
 *
 * @param {Array} list - List of items
 * @param {string} key - Key to use for uniqueness
 * @returns {Array} - Unique list of items
 */
/**
 * Generates an array of referentially unique items from a list of arrays.
 *
 * @param  {...Array} arrays - A list of arrays
 * @returns {Array} - Returns a flattened array with unique items
 * @throws {Error} - Throws if arrays is not defined
 * @throws {TypeError} - Throws if any of the arguments is not an array
 */
export const getUniqueList = (...arrays: unknown[][]): unknown[] => {
  if (arrays.length === 0) {
    throw new Error('At least one array must be defined.');
  }
  arrays.forEach((array, index) => {
    if (!Array.isArray(array)) {
      throw new TypeError(
        `Argument at position ${index} is not an array. Found ${typeof array}.`,
      );
    }
  });

  const flattenedArray = arrays.flat();

  const uniqueArray = Array.from(new Set(flattenedArray));

  return uniqueArray;
};
