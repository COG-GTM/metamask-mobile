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

describe('browserReducer UPDATE_TAB', () => {
  it('updates only the target tab and keeps other tab references', () => {
    const tab1 = { id: 1, url: 'about:blank', isArchived: false };
    const tab2 = { id: 2, url: 'about:blank', isArchived: false };
    const initialState = { tabs: [tab1, tab2], activeTab: 1 };

    const newState = browserReducer(initialState, {
      type: 'UPDATE_TAB',
      id: 2,
      data: { isArchived: true },
    });

    expect(newState.tabs).toEqual([tab1, { ...tab2, isArchived: true }]);
    expect(newState.tabs[0]).toBe(tab1);
    expect(newState.tabs[1]).not.toBe(tab2);
    expect(tab2.isArchived).toBe(false);
  });
});
