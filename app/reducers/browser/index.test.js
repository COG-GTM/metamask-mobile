import browserReducer from './index';
import AppConstants from '../../core/AppConstants';

describe('browserReducer REMOVE_FROM_BROWSER_HISTORY', () => {
  it('removes entries matching the provided url from history', () => {
    const initialState = {
      history: [
        { url: 'https://example.com', name: 'Example' },
        { url: 'https://metamask.io', name: 'MetaMask' },
        { url: 'https://example.com', name: 'Example duplicate' },
      ],
      whitelist: [],
      tabs: [],
      favicons: [],
      activeTab: null,
    };

    const action = {
      type: 'REMOVE_FROM_BROWSER_HISTORY',
      url: 'https://example.com',
    };

    const expectedState = {
      history: [{ url: 'https://metamask.io', name: 'MetaMask' }],
      whitelist: [],
      tabs: [],
      favicons: [],
      activeTab: null,
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });
});

describe('browserReducer STORE_FAVICON_URL', () => {
  it('adds favicon in the state', () => {
    const initialState = {
      history: [],
      whitelist: [],
      tabs: [],
      favicons: [],
      activeTab: null,
    };

    const action = {
      type: 'STORE_FAVICON_URL',
      origin: 'testOrigin',
      url: 'testUrl',
    };

    const expectedState = {
      history: [],
      whitelist: [],
      tabs: [],
      favicons: [{ origin: 'testOrigin', url: 'testUrl' }],
      activeTab: null,
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });

  it('limits the number of stored favicons in state to FAVICON_CACHE_MAX_SIZE', () => {
    const initialState = {
      history: [],
      whitelist: [],
      tabs: [],
      favicons: new Array(AppConstants.FAVICON_CACHE_MAX_SIZE).fill({
        origin: 'oldOrigin',
        url: 'oldUrl',
      }),
      activeTab: null,
    };

    const action = {
      type: 'STORE_FAVICON_URL',
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
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });
});
