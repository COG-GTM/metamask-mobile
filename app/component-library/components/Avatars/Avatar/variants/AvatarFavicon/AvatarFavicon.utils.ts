const svgContentTypeChecks = new Map<string, Promise<boolean>>();

const fetchIsSvgContentType = async (uri: string): Promise<boolean> => {
  const response = await fetch(uri, { method: 'HEAD' });
  const contentType = response.headers.get('Content-Type');
  return !!contentType?.includes('image/svg+xml');
};

/**
 * Resolves whether the given favicon URI serves SVG content.
 * The HEAD request is made at most once per URI per app session; failed
 * requests are not cached so they can be retried on a later mount.
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

export const clearSvgContentTypeCache = () => svgContentTypeChecks.clear();
