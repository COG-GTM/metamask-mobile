const svgContentTypeChecks = new Map<string, Promise<boolean>>();

/**
 * Sends a HEAD request and checks whether the response Content-Type is SVG.
 * Rejects on non-2xx responses so transient server errors are not cached.
 * @param uri the favicon URI
 */
const fetchIsSvgContentType = async (uri: string): Promise<boolean> => {
  const response = await fetch(uri, { method: 'HEAD' });
  if (!response.ok) {
    throw new Error(`HEAD ${uri} failed with status ${response.status}`);
  }
  const contentType = response.headers.get('Content-Type');
  return !!contentType?.includes('image/svg+xml');
};

/**
 * Resolves whether the given favicon URI serves SVG content.
 * The HEAD request is made at most once per URI per app session; failed
 * requests and non-2xx responses are not cached so they can be retried on a later mount.
 * @param uri the favicon URI
 */
export const checkSvgContentType = (uri: string): Promise<boolean> => {
  // Skip header check for data URIs
  if (uri.startsWith('data:image/svg+xml')) {
    return Promise.resolve(true);
  }

  const cached = svgContentTypeChecks.get(uri);
  if (cached) {
    return cached;
  }

  const check = fetchIsSvgContentType(uri).catch(() => {
    svgContentTypeChecks.delete(uri);
    return false;
  });
  svgContentTypeChecks.set(uri, check);
  return check;
};

/**
 * Clears all memoized Content-Type checks.
 */
export const clearSvgContentTypeCache = () => svgContentTypeChecks.clear();
