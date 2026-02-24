import browserReducer from './index';
import AppConstants from '../../core/AppConstants';

describe('browserReducer STORE_FAVICON_URL', () => {
  it('adds favicon in the state', () => {
    const initialState = {
      history: [] as { url: string; name: string }[],
      whitelist: [] as string[],
      tabs: [] as { url: string; id: number; linkType?: string; [key: string]: unknown }[],
      favicons: [] as { origin: string; url: string }[],
      activeTab: null as number | null,
      visitedDappsByHostname: {} as Record<string, boolean>,
    };

    const action = {
      type: 'STORE_FAVICON_URL' as const,
      origin: 'testOrigin',
      url: 'testUrl',
    };

    const expectedState = {
      history: [],
      whitelist: [],
      tabs: [],
      favicons: [{ origin: 'testOrigin', url: 'testUrl' }],
      activeTab: null,
      visitedDappsByHostname: {},
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });

  it('limits the number of stored favicons in state to FAVICON_CACHE_MAX_SIZE', () => {
    const initialState = {
      history: [] as { url: string; name: string }[],
      whitelist: [] as string[],
      tabs: [] as { url: string; id: number; linkType?: string; [key: string]: unknown }[],
      favicons: new Array(AppConstants.FAVICON_CACHE_MAX_SIZE).fill({
        origin: 'oldOrigin',
        url: 'oldUrl',
      }) as { origin: string; url: string }[],
      activeTab: null as number | null,
      visitedDappsByHostname: {} as Record<string, boolean>,
    };

    const action = {
      type: 'STORE_FAVICON_URL' as const,
      origin: 'newOrigin',
      url: 'newUrl',
    };

    const expectedState = {
      history: [],
      whitelist: [],
      tabs: [],
      favicons: [
        { origin: 'newOrigin', url: 'newUrl' },
        ...new Array(AppConstants.FAVICON_CACHE_MAX_SIZE - 1).fill({
          origin: 'oldOrigin',
          url: 'oldUrl',
        }),
      ],
      activeTab: null,
      visitedDappsByHostname: {},
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });
});
