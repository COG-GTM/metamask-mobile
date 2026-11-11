import AppConstants from '../../../app/core/AppConstants';

if (process.env.JEST_WORKER_ID !== undefined) {
  // monkeypatch for Jest
  // TODO: mock properly in test setup; ideally without xhr2
  // see https://github.com/MetaMask/metamask-mobile/issues/10390
  // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
  const { XMLHttpRequest: _XMLHttpRequest } = require('xhr2');
  class FakeXMLHttpRequest extends _XMLHttpRequest {
    url?: string;
    status?: number;
    responseText?: string;
    open(_method: string, url: string) {
      this.url = url;
    }

    send() {
      this.status = 200;
      this.responseText = '';
      this.onload();
    }
  }

  // This should probably be done completely differently - the types are not the issue here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.XMLHttpRequest = FakeXMLHttpRequest as any;
}

const originalSend = global.XMLHttpRequest.prototype.send;
const originalOpen = global.XMLHttpRequest.prototype.open;

/**
 * Extracts the normalized hostname of a URL.
 *
 * @param url - The URL to parse.
 * @returns The lower-cased hostname without trailing dots, or `undefined` if the URL cannot be parsed.
 */
const getHostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.+$/u, '');
  } catch {
    return undefined;
  }
};

/**
 * Determines whether a request must be blocked while basic functionality is disabled.
 * Only the parsed hostname is matched: a blocked domain matches itself and its subdomains,
 * and legacy fragments match anywhere in the hostname. URLs that cannot be parsed are blocked.
 *
 * @param url - The request URL.
 * @returns `true` if the request should be blocked.
 */
export const shouldBlockRequest = (url: string | undefined): boolean => {
  const hostname = getHostname(url ?? '');
  if (!hostname) {
    // Fail closed on URLs whose host cannot be determined
    return true;
  }
  return (
    AppConstants.BASIC_FUNCTIONALITY_BLOCKED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    ) ||
    AppConstants.BASIC_FUNCTIONALITY_BLOCKED_HOST_FRAGMENTS.some((fragment) =>
      hostname.includes(fragment),
    )
  );
};

export function overrideXMLHttpRequest() {
  // Each request keeps its own URL so that `send` checks the request being sent
  const requestUrls = new WeakMap<XMLHttpRequest, string>();

  const failBlockedRequest = (request: XMLHttpRequest, url: string) => {
    console.error(new Error(`Disallowed URL: ${url}`));
    // Emit `error` so callers such as `fetch` reject instead of hanging
    setTimeout(() => {
      request.dispatchEvent({ type: 'error' } as unknown as Event);
      request.dispatchEvent({ type: 'loadend' } as unknown as Event);
    }, 0);
  };

  // Override the 'open' method to capture the request URL
  global.XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    user?: string | null,
    password?: string | null,
  ) {
    const requestUrl = url?.toString();
    requestUrls.set(this, requestUrl);
    return originalOpen.apply(this, [
      method,
      requestUrl,
      async,
      user,
      password,
    ]);
  };

  // Override the 'send' method to implement the blocking logic
  global.XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    ...args: unknown[]
  ) {
    const requestUrl = requestUrls.get(this) ?? '';
    if (shouldBlockRequest(requestUrl)) {
      failBlockedRequest(this, requestUrl);
      return;
    }
    return originalSend.call(this, ...args);
  };
}

export function restoreXMLHttpRequest() {
  global.XMLHttpRequest.prototype.open = originalOpen;
  global.XMLHttpRequest.prototype.send = originalSend;
}
