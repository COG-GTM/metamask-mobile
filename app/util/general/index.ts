// eslint-disable-next-line @typescript-eslint/no-shadow
import URL from 'url-parse';

/**
 * Lowercases the given value, tolerating non-string input.
 */
export const tlc = (str?: unknown) =>
  (str as string | undefined)?.toLowerCase?.();

interface NavigatorState {
  index?: number;
  routes?: NavigatorRoute[];
}

interface NavigatorRoute extends NavigatorState {
  name?: string;
  state?: NavigatorState;
}

/**
 * Fetch that fails after timeout
 *
 * @param url - Url to fetch
 * @param options - Options to send with the request
 * @param timeout - Timeout to fail request
 *
 * @returns - Promise resolving the request
 */
export function timeoutFetch(
  url: string,
  options?: RequestInit,
  timeout = 500,
): Promise<Response> {
  return Promise.race<Response>([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout),
    ),
  ]);
}

export function findRouteNameFromNavigatorState(
  routes: NavigatorRoute[] | unknown[],
): string {
  let route: NavigatorRoute | undefined = (routes as NavigatorRoute[])?.[
    routes.length - 1
  ];
  if (route.state) {
    route = route.state;
  }
  while (route?.index !== undefined) {
    route = route.routes?.[route.index];
    // Unguarded on purpose: a missing route throws here, as it did before typing.
    if ((route as NavigatorRoute).state) {
      route = (route as NavigatorRoute).state;
    }
  }

  let name = route?.name;

  // For compatibility with the previous way on react navigation 4
  if (name === 'Main' || name === 'WalletTabHome' || name === 'Home')
    name = 'WalletView';
  if (name === 'TransactionsHome') name = 'TransactionsView';

  return name as string;
}
export const capitalize = (str?: string | null) =>
  (str && str.charAt(0).toUpperCase() + str.slice(1)) || false;

export const toLowerCaseEquals = (a?: unknown, b?: unknown) => {
  if (!a && !b) return false;
  return tlc(a) === tlc(b);
};

export const shallowEqual = (object1: object, object2: object) => {
  const record1 = object1 as Record<string, unknown>;
  const record2 = object2 as Record<string, unknown>;
  const keys1 = Object.keys(record1);
  const keys2 = Object.keys(record2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (record1[key] !== record2[key]) {
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
export const renderShortText = (text: string, chars = 4) => {
  try {
    // The 5 constant represents the 2 extra chars and the 3 dots.
    if (text.length <= chars * 2 + 5) return text;
    return `${text.substr(0, chars + 2)}...${text.substr(-chars)}`;
  } catch {
    return text;
  }
};

/**
 * Method to retrieve the communication protocol from an URL.
 * @param url - URL input.
 * @returns string representing the protocol or 'undefined' if no protocol is extracted.
 */
export const getURLProtocol = (url: string) => {
  try {
    const { protocol } = new URL(url);
    return protocol.replace(':', '');
  } catch {
    return;
  }
};

/**
 * Method to verify if the uri is from ipfs or not
 * /ipfs/ -> true
 * ipfs:// -> true
 * ipfs://ipfs/ -> true
 * https:// -> false
 * @param uri - string representing the source uri to the file
 * @returns true if it's an ipfs url
 */
export const isIPFSUri = (uri?: string | null) => {
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
export const deepJSONParse = ({
  jsonString,
  skipNumbers = true,
}: {
  jsonString: string;
  skipNumbers?: boolean;
}) => {
  // Parse the initial JSON string
  const parsedObject = JSON.parse(jsonString);

  // Function to recursively parse stringified properties
  function parseProperties(obj: Record<string, unknown>) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        const isNumber = !isNaN(obj[key] as unknown as number);
        // Only parse if value is not a number OR value is a number AND numbers are not skipped
        if (!isNumber || (isNumber && !skipNumbers)) {
          try {
            // Attempt to parse the string as JSON
            const parsed = JSON.parse(obj[key] as string);
            obj[key] = parsed;
            // If the parsed value is an object, parse its properties too
            if (typeof parsed === 'object') {
              parseProperties(parsed as Record<string, unknown>);
            }
          } catch (e) {
            // If parsing throws, it's not a JSON string, so do nothing
          }
        }
      } else if (typeof obj[key] === 'object') {
        // If it's an object, parse its properties
        parseProperties(obj[key] as Record<string, unknown>);
      }
    });
  }

  // Start parsing from the root object
  parseProperties(parsedObject);

  return parsedObject;
};

/**
 * Generates an array of referentially unique items from a list of arrays.
 *
 * @param arrays - A list of arrays
 * @returns Returns a flattened array with unique items
 * @throws Throws if arrays is not defined
 * @throws Throws if any of the arguments is not an array
 */
export const getUniqueList = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) {
    throw new Error('At least one array must be defined.');
  }
  // Check if every argument is an array
  arrays.forEach((array, index) => {
    if (!Array.isArray(array)) {
      throw new TypeError(
        `Argument at position ${index} is not an array. Found ${typeof array}.`,
      );
    }
  });

  // Flatten the arrays
  const flattenedArray = arrays.flat();

  // Create array with unique items
  const uniqueArray = Array.from(new Set(flattenedArray));

  return uniqueArray;
};
