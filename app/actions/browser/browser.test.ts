import {
  BrowserActionTypes,
  addToViewedDapp,
  addToHistory,
  clearHistory,
  addToWhitelist,
  closeAllTabs,
  createNewTab,
  closeTab,
  setActiveTab,
  updateTab,
  storeFavicon,
} from './index';

describe('browser actions', () => {
  it('addToViewedDapp', () => {
    expect(addToViewedDapp('metamask.io')).toEqual({
      type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
      hostname: 'metamask.io',
    });
  });

  it('addToHistory', () => {
    expect(addToHistory({ url: 'https://a.com', name: 'A' })).toEqual({
      type: 'ADD_TO_BROWSER_HISTORY',
      url: 'https://a.com',
      name: 'A',
    });
  });

  it('clearHistory uses Date.now as id', () => {
    expect(clearHistory(true, false)).toEqual({
      type: 'CLEAR_BROWSER_HISTORY',
      id: Date.now(),
      metricsEnabled: true,
      marketingEnabled: false,
    });
  });

  it('addToWhitelist', () => {
    expect(addToWhitelist('https://a.com')).toEqual({
      type: 'ADD_TO_BROWSER_WHITELIST',
      url: 'https://a.com',
    });
  });

  it('closeAllTabs', () => {
    expect(closeAllTabs()).toEqual({ type: 'CLOSE_ALL_TABS' });
  });

  it('createNewTab', () => {
    expect(createNewTab('https://a.com', 'deeplink')).toEqual({
      type: 'CREATE_NEW_TAB',
      url: 'https://a.com',
      linkType: 'deeplink',
      id: Date.now(),
    });
  });

  it('closeTab / setActiveTab / updateTab', () => {
    expect(closeTab(1)).toEqual({ type: 'CLOSE_TAB', id: 1 });
    expect(setActiveTab(2)).toEqual({ type: 'SET_ACTIVE_TAB', id: 2 });
    expect(updateTab(3, { url: 'x' })).toEqual({
      type: 'UPDATE_TAB',
      id: 3,
      data: { url: 'x' },
    });
  });

  it('storeFavicon', () => {
    expect(storeFavicon({ origin: 'a.com', url: 'https://a.com/f.ico' })).toEqual(
      {
        type: 'STORE_FAVICON_URL',
        origin: 'a.com',
        url: 'https://a.com/f.ico',
      },
    );
  });
});
