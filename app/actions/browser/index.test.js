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
  it('BrowserActionTypes has correct values', () => {
    expect(BrowserActionTypes.ADD_TO_VIEWED_DAPP).toBe('ADD_TO_VIEWED_DAPP');
  });

  it('addToViewedDapp creates correct action', () => {
    expect(addToViewedDapp('uniswap.org')).toEqual({
      type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
      hostname: 'uniswap.org',
    });
  });

  it('addToHistory creates correct action', () => {
    expect(addToHistory({ url: 'https://example.com', name: 'Example' })).toEqual({
      type: 'ADD_TO_BROWSER_HISTORY',
      url: 'https://example.com',
      name: 'Example',
    });
  });

  it('clearHistory creates correct action', () => {
    const action = clearHistory(true, false);
    expect(action.type).toBe('CLEAR_BROWSER_HISTORY');
    expect(action.metricsEnabled).toBe(true);
    expect(action.marketingEnabled).toBe(false);
    expect(typeof action.id).toBe('number');
  });

  it('addToWhitelist creates correct action', () => {
    expect(addToWhitelist('https://trusted.com')).toEqual({
      type: 'ADD_TO_BROWSER_WHITELIST',
      url: 'https://trusted.com',
    });
  });

  it('closeAllTabs creates correct action', () => {
    expect(closeAllTabs()).toEqual({ type: 'CLOSE_ALL_TABS' });
  });

  it('createNewTab creates correct action', () => {
    const action = createNewTab('https://example.com', 'deeplink');
    expect(action.type).toBe('CREATE_NEW_TAB');
    expect(action.url).toBe('https://example.com');
    expect(action.linkType).toBe('deeplink');
    expect(typeof action.id).toBe('number');
  });

  it('closeTab creates correct action', () => {
    expect(closeTab(42)).toEqual({ type: 'CLOSE_TAB', id: 42 });
  });

  it('setActiveTab creates correct action', () => {
    expect(setActiveTab(5)).toEqual({ type: 'SET_ACTIVE_TAB', id: 5 });
  });

  it('updateTab creates correct action', () => {
    const data = { url: 'https://new.com', image: 'img.png' };
    expect(updateTab(1, data)).toEqual({
      type: 'UPDATE_TAB',
      id: 1,
      data,
    });
  });

  it('storeFavicon creates correct action', () => {
    expect(storeFavicon({ origin: 'https://example.com', url: 'https://example.com/fav.ico' })).toEqual({
      type: 'STORE_FAVICON_URL',
      origin: 'https://example.com',
      url: 'https://example.com/fav.ico',
    });
  });
});
