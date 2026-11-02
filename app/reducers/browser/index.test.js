import browserReducer from './index';
import AppConstants from '../../core/AppConstants';

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

describe('browserReducer STORE_FAVICON_URL negative cache', () => {
  it('stores expiresAt for a cached miss', () => {
    const newState = browserReducer(
      { favicons: [] },
      {
        type: 'STORE_FAVICON_URL',
        origin: 'dapp.test',
        url: '',
        expiresAt: 123,
      },
    );

    expect(newState.favicons).toEqual([
      { origin: 'dapp.test', url: '', expiresAt: 123 },
    ]);
  });

  it('replaces the existing entry for the same origin', () => {
    const newState = browserReducer(
      {
        favicons: [
          { origin: 'other.test', url: 'otherUrl' },
          { origin: 'dapp.test', url: '', expiresAt: 123 },
        ],
      },
      { type: 'STORE_FAVICON_URL', origin: 'dapp.test', url: 'newUrl' },
    );

    expect(newState.favicons).toEqual([
      { origin: 'dapp.test', url: 'newUrl' },
      { origin: 'other.test', url: 'otherUrl' },
    ]);
  });
});
