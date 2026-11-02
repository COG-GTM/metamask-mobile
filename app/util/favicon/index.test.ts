import {
  getFaviconFromCache,
  getFaviconURLFromHtml,
  cacheFavicon,
  isFaviconSVG,
  resolveFavicon,
  FAVICON_MISS_TTL_MS,
  FAVICON_FETCH_ERROR_TTL_MS,
} from '.';
import { DOMParser } from '@xmldom/xmldom';
import { storeFavicon } from '../../actions/browser';
import browserReducer from '../../reducers/browser';

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

// Make sure to clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('favicon utility getFaviconURLFromHtml() function', () => {
  /**
   * should be able to find favicon from html links collection
   */
  it('returns favicon URL from html', async () => {
    // mocking with an actual html page content
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
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
              '    <link\n' +
              '      href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.14.1/css/mdb.min.css"\n' +
              '      rel="stylesheet"\n' +
              '    />\n' +
              '    <link rel="stylesheet" href="index.css" type="text/css" />\n' +
              '  </head></html>',
          ),
        ok: true,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml(
      'metamask.github.io/test-dapp/',
    );
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/test-dapp/metamask-fox.svg'),
    );
  });

  it('ensures fetch is not overriding cookies policy', async () => {
    // mocking with an actual html page content
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(''),
        ok: true,
      } as Response),
    );

    await getFaviconURLFromHtml('metamask.github.io/test-dapp/');

    // Ensure fetch credentials is set to 'omit'
    // non regression test for https://github.com/MetaMask/mobile-planning/issues/1561
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toEqual(
      expect.objectContaining({ credentials: 'omit' }),
    );
  });

  /**
   * origin can be a non valid url, but it should be converted to a valid url
   */
  it('returns favicon URL from valid domain only origin', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="metamask-fox.svg"></head></html>',
          ),
        ok: true,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('returns favicon URL with non conforming IE html format', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            '<html><head><link rel="shortcut icon" href="metamask-fox.svg"></head></html>',
          ),
        ok: true,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox.svg'),
    );
  });

  it('ignores non favicon icons in html', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            '<html><head>' +
              '<link rel="apple-touch-icon" sizes="192x192" href="./images/192x192_App_Icon.png"/>\n' +
              '<link rel="apple-touch-icon" sizes="512x512" href="./images/512x512_App_Icon.png"/>' +
              '</head></html>',
          ),
        ok: true,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toBeUndefined();
  });

  /**
   * return the first favicon found as it's done in the extension
   */
  it('returns the first favicon in html', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            '<html><head><link rel="icon" href="metamask-fox1.svg"><link rel="icon" href="metamask-fox2.svg"></head></html>',
          ),
        ok: true,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml('metamask.github.io');
    expect(faviconUrl).toEqual(
      new URL('https://metamask.github.io/metamask-fox1.svg'),
    );
  });

  /**
   * return empty string if no favicon found and this will trigger fallback icon
   */
  it('returns empty string for invalid origin', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      } as Response),
    );

    const faviconUrl = await getFaviconURLFromHtml('invalid-url');
    expect(faviconUrl).toBeUndefined();
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

describe('resolveFavicon function', () => {
  const NOW = 1_700_000_000_000;
  let favicons: { origin: string; url: string; expiresAt?: number }[];
  const getStateMock = store.getState as jest.Mock;
  const dispatchMock = store.dispatch as jest.Mock;
  const originalGetState = getStateMock.getMockImplementation();

  const htmlResponse = (html: string) =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response);

  beforeEach(() => {
    favicons = [];
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    getStateMock.mockImplementation(() => ({ browser: { favicons } }));
    dispatchMock.mockImplementation((action) => {
      favicons = (
        browserReducer as unknown as (
          state: { favicons: typeof favicons },
          action: unknown,
        ) => { favicons: typeof favicons }
      )({ favicons }, action).favicons;
      return action;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    dispatchMock.mockReset();
  });

  afterAll(() => {
    getStateMock.mockImplementation(originalGetState);
  });

  it('caches a found favicon and serves later calls from the cache', async () => {
    global.fetch = jest.fn(() =>
      htmlResponse(
        '<html><head><link rel="icon" href="fox.svg"></head></html>',
      ),
    );

    expect(await resolveFavicon('https://dapp.test/page')).toBe(
      'https://dapp.test/fox.svg',
    );
    expect(await resolveFavicon('dapp.test')).toBe('https://dapp.test/fox.svg');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(favicons).toEqual([
      { origin: 'dapp.test', url: 'https://dapp.test/fox.svg' },
    ]);
  });

  it('caches a page without icon link as a miss for FAVICON_MISS_TTL_MS', async () => {
    global.fetch = jest.fn(() =>
      htmlResponse('<html><head><title>no icon</title></head></html>'),
    );

    expect(await resolveFavicon('dapp.test')).toBeUndefined();
    expect(await resolveFavicon('dapp.test')).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(favicons).toEqual([
      { origin: 'dapp.test', url: '', expiresAt: NOW + FAVICON_MISS_TTL_MS },
    ]);
    expect(getFaviconFromCache('dapp.test')).toBeUndefined();
  });

  it.each([
    ['a non-OK response', () => Promise.resolve({ ok: false } as Response)],
    ['a network error', () => Promise.reject(new Error('offline'))],
  ])('caches %s as a miss for FAVICON_FETCH_ERROR_TTL_MS', async (_, impl) => {
    global.fetch = jest.fn(impl);

    expect(await resolveFavicon('dapp.test')).toBeUndefined();
    expect(await resolveFavicon('dapp.test')).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(favicons).toEqual([
      {
        origin: 'dapp.test',
        url: '',
        expiresAt: NOW + FAVICON_FETCH_ERROR_TTL_MS,
      },
    ]);
  });

  it('refetches once a cached miss has expired and replaces it', async () => {
    favicons = [{ origin: 'dapp.test', url: '', expiresAt: NOW - 1 }];
    global.fetch = jest.fn(() =>
      htmlResponse(
        '<html><head><link rel="icon" href="/fox.png"></head></html>',
      ),
    );

    expect(await resolveFavicon('dapp.test')).toBe('https://dapp.test/fox.png');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(favicons).toEqual([
      { origin: 'dapp.test', url: 'https://dapp.test/fox.png' },
    ]);
  });

  it('shares one in-flight fetch between concurrent calls for the same host', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    global.fetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const calls = [
      resolveFavicon('https://dapp.test/a'),
      resolveFavicon('dapp.test'),
      resolveFavicon('https://dapp.test/b?x=1'),
    ];
    resolveFetch({
      ok: true,
      text: () => Promise.resolve('<html><head></head></html>'),
    } as Response);

    expect(await Promise.all(calls)).toEqual([undefined, undefined, undefined]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });

  it('skips an invalid icon href and uses the next icon link', async () => {
    global.fetch = jest.fn(() =>
      htmlResponse(
        '<html><head><link rel="icon" href="http://[bad"><link rel="icon" href="ok.ico"></head></html>',
      ),
    );

    expect(await resolveFavicon('dapp.test')).toBe('https://dapp.test/ok.ico');
  });

  it('only parses the document up to the end of <head>', async () => {
    const parseSpy = jest.spyOn(DOMParser.prototype, 'parseFromString');
    global.fetch = jest.fn(() =>
      htmlResponse(
        '<html><HEAD><link rel="icon" href="fox.svg"></HEAD ><body><div>big body</div></body></html>',
      ),
    );

    expect(await resolveFavicon('dapp.test')).toBe('https://dapp.test/fox.svg');
    expect(parseSpy.mock.calls[0][0]).not.toContain('big body');
  });

  it('does not fetch for a null origin', async () => {
    global.fetch = jest.fn();

    expect(await resolveFavicon('null')).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
