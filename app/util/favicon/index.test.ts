import {
  getFaviconFromCache,
  getFaviconURLFromHtml,
  cacheFavicon,
  isFaviconSVG,
  isSafeFaviconUrl,
  FAVICON_FETCH_TIMEOUT_MS,
  MAX_FAVICON_HTML_LENGTH,
  MAX_FAVICON_URL_LENGTH,
} from '.';
import { storeFavicon } from '../../actions/browser';

jest.mock('../../store', () => {
  const actual = jest.requireActual('../../store');
  return {
    ...actual,
    store: {
      ...actual.store,
      getState: jest.fn(() => ({
        browser: {
          favicons: [
            {
              origin: 'metamask.github.io',
              url: 'https://metamask.github.io/metamask-fox.svg',
            },
          ],
        },
      })),
      dispatch: jest.fn(),
    },
  };
});

// Import the store module after the mock is set up
import { store } from '../../store';

const SCRIPT_URL = ['javascript', 'alert(1)'].join(':');

// Make sure to clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

interface FakeResponse {
  status?: number;
  headers?: Record<string, string>;
  chunks?: string[];
  networkError?: boolean;
  neverResponds?: boolean;
}

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];
  static nextResponse: FakeResponse = {};

  readyState = 0;
  status = 0;
  responseText = '';
  withCredentials = true;
  aborted = false;
  receivedChunks = 0;
  method?: string;
  url?: string;
  requestHeaders: Record<string, string> = {};
  onreadystatechange?: () => void;
  onprogress?: (event: { loaded: number }) => void;
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  ontimeout?: () => void;

  private response: FakeResponse = FakeXMLHttpRequest.nextResponse;

  constructor() {
    FakeXMLHttpRequest.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }

  getResponseHeader(name: string) {
    const headers = this.response.headers ?? {};
    const key = Object.keys(headers).find(
      (header) => header.toLowerCase() === name.toLowerCase(),
    );
    return key ? headers[key] : null;
  }

  send() {
    if (this.response.neverResponds) return;
    Promise.resolve().then(() => this.respond());
  }

  abort() {
    this.aborted = true;
    this.readyState = 4;
    this.onabort?.();
  }

  private respond() {
    if (this.response.networkError) {
      this.readyState = 4;
      this.onerror?.();
      return;
    }
    this.status = this.response.status ?? 200;
    this.readyState = 2;
    this.onreadystatechange?.();
    for (const chunk of this.response.chunks ?? []) {
      if (this.aborted) return;
      this.receivedChunks++;
      this.responseText += chunk;
      this.readyState = 3;
      this.onreadystatechange?.();
      this.onprogress?.({ loaded: this.responseText.length });
    }
    if (this.aborted) return;
    this.readyState = 4;
    this.onreadystatechange?.();
    this.onload?.();
  }
}

const respondWith = (response: FakeResponse) => {
  FakeXMLHttpRequest.nextResponse = {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    ...response,
  };
};

const respondWithHtml = (html: string) => respondWith({ chunks: [html] });

const originalXMLHttpRequest = global.XMLHttpRequest;

describe('favicon utility getFaviconURLFromHtml() function', () => {
  beforeEach(() => {
    FakeXMLHttpRequest.instances = [];
    global.XMLHttpRequest =
      FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
    jest.useRealTimers();
  });

  /**
   * should be able to find favicon from html links collection
   */
  it('returns favicon URL from html', async () => {
    // mocking with an actual html page content
    respondWithHtml(
      '<html>\n' +
        '  <head>\n' +
        '    <meta charset="UTF-8" />\n' +
        '    <title>E2E Test Dapp</title>\n' +
        '    <link\n' +
        '      rel="stylesheet"\n' +
        '      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"\n' +
        '    />\n' +
        '    <link rel="icon" type="image/svg" href="metamask-fox.svg" />\n' +
        '    <link\n' +
        '      href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/css/bootstrap.min.css"\n' +
        '      rel="stylesheet"\n' +
        '    />\n' +
        '    <link rel="stylesheet" href="index.css" type="text/css" />\n' +
        '  </head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml(
      'metamask.github.io/test-dapp/',
    );
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('fetches only the site root, not the full page address', async () => {
    respondWithHtml('');

    await getFaviconURLFromHtml(
      'https://metamask.github.io/test-dapp/?secret=1#hash',
    );

    expect(FakeXMLHttpRequest.instances).toHaveLength(1);
    expect(FakeXMLHttpRequest.instances[0].method).toBe('GET');
    expect(FakeXMLHttpRequest.instances[0].url).toBe(
      'https://metamask.github.io/',
    );
  });

  it('does not fetch non http(s) origins', async () => {
    respondWithHtml('<html><head><link rel="icon" href="a.png"></head>');

    const faviconUrl = await getFaviconURLFromHtml('ftp://metamask.github.io/');

    expect(faviconUrl).toBeUndefined();
    expect(FakeXMLHttpRequest.instances).toHaveLength(0);
  });

  it('ensures the request is not sending cookies', async () => {
    respondWithHtml('');

    await getFaviconURLFromHtml('metamask.github.io/test-dapp/');

    // non regression test for https://github.com/MetaMask/mobile-planning/issues/1561
    expect(FakeXMLHttpRequest.instances[0].withCredentials).toBe(false);
  });

  /**
   * origin can be a non valid url, but it should be converted to a valid url
   */
  it('returns favicon URL from valid domain only origin', async () => {
    respondWithHtml(
      '<html><head><link rel="icon" href="metamask-fox.svg"></head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('returns favicon URL with non conforming IE html format', async () => {
    respondWithHtml(
      '<html><head><link rel="shortcut icon" href="metamask-fox.svg"></head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('ignores non favicon icons in html', async () => {
    respondWithHtml(
      '<html><head>' +
        '<link rel="apple-touch-icon" sizes="192x192" href="./images/192x192_App_Icon.png"/>\n' +
        '<link rel="apple-touch-icon" sizes="512x512" href="./images/512x512_App_Icon.png"/>' +
        '</head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toBeUndefined();
  });

  /**
   * return the first favicon found as it's done in the extension
   */
  it('returns the first favicon in html', async () => {
    respondWithHtml(
      '<html><head><link rel="icon" href="metamask-fox1.svg"><link rel="icon" href="metamask-fox2.svg"></head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox1.svg'),
    );
  });

  /**
   * return empty string if no favicon found and this will trigger fallback icon
   */
  it('returns undefined when the response is not ok', async () => {
    respondWith({
      status: 404,
      chunks: ['<html><head><link rel="icon" href="a.png"></head></html>'],
    });

    const faviconUrl = await getFaviconURLFromHtml('invalid-url');
    expect(faviconUrl).toBeUndefined();
    expect(FakeXMLHttpRequest.instances[0].aborted).toBe(true);
  });

  it('returns undefined on network error', async () => {
    respondWith({ networkError: true });

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toBeUndefined();
  });

  it('aborts non HTML responses before reading the body', async () => {
    respondWith({
      headers: { 'Content-Type': 'application/octet-stream' },
      chunks: ['<html><head><link rel="icon" href="a.png"></head></html>'],
    });

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');

    expect(faviconUrl).toBeUndefined();
    expect(FakeXMLHttpRequest.instances[0].aborted).toBe(true);
    expect(FakeXMLHttpRequest.instances[0].receivedChunks).toBe(0);
  });

  it('aborts responses whose Content-Length exceeds the cap', async () => {
    respondWith({
      headers: {
        'Content-Type': 'text/html',
        'Content-Length': String(50 * 1024 * 1024),
      },
      chunks: ['<html><head><link rel="icon" href="a.png"></head></html>'],
    });

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');

    expect(faviconUrl).toBeUndefined();
    expect(FakeXMLHttpRequest.instances[0].aborted).toBe(true);
    expect(FakeXMLHttpRequest.instances[0].receivedChunks).toBe(0);
  });

  it('aborts while reading once more than the cap is received', async () => {
    const chunkSize = 64 * 1024;
    const chunks = [
      '<html><head><link rel="icon" href="a.png"></head><body>',
      ...Array(800).fill('a'.repeat(chunkSize)),
    ];
    respondWith({ chunks });

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');

    const xhr = FakeXMLHttpRequest.instances[0];
    expect(faviconUrl).toBeUndefined();
    expect(xhr.aborted).toBe(true);
    expect(xhr.receivedChunks).toBeLessThan(
      MAX_FAVICON_HTML_LENGTH / chunkSize + 3,
    );
  });

  it('aborts the request after the timeout', async () => {
    jest.useFakeTimers();
    respondWith({ neverResponds: true });

    const lookup = getFaviconURLFromHtml('metamask.github.io');
    jest.advanceTimersByTime(FAVICON_FETCH_TIMEOUT_MS);

    expect(await lookup).toBeUndefined();
    expect(FakeXMLHttpRequest.instances[0].aborted).toBe(true);
  });

  it('skips oversized and non http(s) icon links', async () => {
    const oversizedDataUrl = `data:image/png;base64,${'A'.repeat(
      MAX_FAVICON_URL_LENGTH,
    )}`;
    respondWithHtml(
      `<html><head><link rel="icon" href="${oversizedDataUrl}">` +
        `<link rel="icon" href="${SCRIPT_URL}">` +
        '<link rel="icon" href="metamask-fox.svg"></head></html>',
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('returns undefined when the only icon link is oversized', async () => {
    const oversizedDataUrl = `data:image/png;base64,${'A'.repeat(
      MAX_FAVICON_URL_LENGTH,
    )}`;
    respondWithHtml(
      `<html><head><link rel="icon" href="${oversizedDataUrl}"></head></html>`,
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toBeUndefined();
  });

  it('accepts small data:image icons', async () => {
    const dataUrl = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';
    respondWithHtml(
      `<html><head><link rel="icon" href="${dataUrl}"></head></html>`,
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl?.toString()).toBe(dataUrl);
  });

  it('shares a single request between concurrent lookups of the same site', async () => {
    respondWithHtml(
      '<html><head><link rel="icon" href="metamask-fox.svg"></head></html>',
    );

    const results = await Promise.all([
      getFaviconURLFromHtml('https://metamask.github.io/a'),
      getFaviconURLFromHtml('https://metamask.github.io/b'),
    ]);

    expect(FakeXMLHttpRequest.instances).toHaveLength(1);
    expect(results[0]).toEqual(results[1]);
  });
});

describe('isSafeFaviconUrl function', () => {
  it.each([
    'https://metamask.github.io/metamask-fox.svg',
    'http://localhost:8080/favicon.ico',
    'data:image/png;base64,AAAA',
  ])('accepts %s', (url) => {
    expect(isSafeFaviconUrl(url)).toBe(true);
  });

  it.each([
    undefined,
    '',
    SCRIPT_URL,
    'data:text/html,<script></script>',
    'file:///etc/passwd',
    `https://metamask.github.io/${'a'.repeat(MAX_FAVICON_URL_LENGTH)}`,
  ])('rejects %s', (url) => {
    expect(isSafeFaviconUrl(url)).toBe(false);
  });
});

describe('favicon utility getFaviconFromCache() function', () => {
  it('returns the correct favicon URL if it exists in the cache', async () => {
    const testOrigin = 'metamask.github.io';
    const testFaviconUrl = 'https://metamask.github.io/metamask-fox.svg';

    const { browser } = store.getState();
    const cachedFavicon = browser.favicons.find(
      (favicon: { origin: string; url: string }) =>
        favicon.origin === testOrigin,
    );
    expect(cachedFavicon).toEqual({ origin: testOrigin, url: testFaviconUrl });

    const faviconUrl = await getFaviconFromCache(testOrigin);
    expect(faviconUrl).toEqual(testFaviconUrl);
  });

  it('ignores unsafe favicon URLs stored in the cache', async () => {
    (store.getState as jest.Mock).mockReturnValueOnce({
      browser: {
        favicons: [
          {
            origin: 'evil.example',
            url: `data:image/png;base64,${'A'.repeat(MAX_FAVICON_URL_LENGTH)}`,
          },
        ],
      },
    });

    expect(getFaviconFromCache('evil.example')).toBeUndefined();
  });

  it('returns undefined if the favicon does not exist in the cache', async () => {
    const faviconUrl = await getFaviconFromCache('nonExistentOrigin');
    expect(faviconUrl).toBeUndefined();
  });
});

describe('cacheFavicon function', () => {
  it('dispatches storeFavicon action if originUrl is valid', async () => {
    const originUrl = 'https://metamask.github.io/test-dapp/';
    const faviconUrl = new URL('https://metamask.github.io/metamask-fox.svg');

    const dispatchMock = jest.spyOn(store, 'dispatch');

    cacheFavicon(originUrl, faviconUrl);

    expect(dispatchMock).toHaveBeenCalledWith(
      storeFavicon({
        origin: 'metamask.github.io',
        url: faviconUrl.toString(),
      }),
    );
  });

  it('dispatches storeFavicon action with fixed origin if originUrl is not valid URL', async () => {
    const originUrl = 'invalid-url';
    const faviconUrl = new URL('https://metamask.github.io/metamask-fox.svg');

    const dispatchMock = jest.spyOn(store, 'dispatch');

    cacheFavicon(originUrl, faviconUrl);

    expect(dispatchMock).toHaveBeenCalledWith(
      storeFavicon({ origin: 'invalid-url', url: faviconUrl.toString() }),
    );
  });
});

describe('cacheFavicon function with unsafe favicon URLs', () => {
  it.each([
    new URL(`data:image/png;base64,${'A'.repeat(5 * 1024 * 1024)}`),
    new URL(SCRIPT_URL),
  ])('does not store %#', (faviconUrl) => {
    const dispatchMock = jest.spyOn(store, 'dispatch');

    cacheFavicon('https://evil.example/', faviconUrl);

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});

describe('isFaviconSVG function', () => {
  it('returns the SVG URL if SVG type passed', async () => {
    const expectedUrl = 'https://metamask.github.io/metamask-fox.svg';
    const faviconUri = { uri: expectedUrl };

    expect(isFaviconSVG(faviconUri)).toEqual(expectedUrl);
  });
  it('returns undefined if source is not SVG', async () => {
    const expectedUrl = 'https://metamask.github.io/metamask-fox.png';
    const faviconUri = { uri: expectedUrl };

    expect(isFaviconSVG(faviconUri)).toBeUndefined();
  });
});
