import URL from 'url-parse';

export const tlc = (str: string | undefined | null): string | undefined =>
  str?.toLowerCase?.();

export function timeoutFetch(
  url: string,
  options: RequestInit,
  timeout = 500,
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout),
    ),
  ]);
}

interface NavigationRoute {
  name?: string;
  index?: number;
  state?: NavigationRoute;
  routes?: NavigationRoute[];
}

export function findRouteNameFromNavigatorState(
  routes: NavigationRoute[],
): string | undefined {
  let route: NavigationRoute | undefined = routes?.[routes.length - 1];
  if (route.state) {
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
export const capitalize = (str: string): string | false =>
  (str && str.charAt(0).toUpperCase() + str.slice(1)) || false;

export const toLowerCaseEquals = (
  a: string | undefined | null,
  b: string | undefined | null,
): boolean => {
  if (!a && !b) return false;
  return tlc(a) === tlc(b);
};

export const shallowEqual = (
  object1: Record<string, unknown>,
  object2: Record<string, unknown>,
): boolean => {
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

export const renderShortText = (text: string, chars = 4): string => {
  try {
    if (text.length <= chars * 2 + 5) return text;
    return `${text.substr(0, chars + 2)}...${text.substr(-chars)}`;
  } catch {
    return text;
  }
};

export const getURLProtocol = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url);
    return protocol.replace(':', '');
  } catch {
    return;
  }
};

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

export const deepJSONParse = ({
  jsonString,
  skipNumbers = true,
}: {
  jsonString: string;
  skipNumbers?: boolean;
}): unknown => {
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
            // Not a JSON string
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

  return [...new Set(arrays.flat())];
};
