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
} from '.';

describe('Browser Actions', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('addToViewedDapp should return correct action', () => {
    expect(addToViewedDapp('example.com')).toStrictEqual({
      type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
      hostname: 'example.com',
    });
  });

  it('addToHistory should return correct action', () => {
    expect(addToHistory({ url: 'https://example.com', name: 'Example' })).toStrictEqual({
      type: 'ADD_TO_BROWSER_HISTORY',
      url: 'https://example.com',
      name: 'Example',
    });
  });

  it('clearHistory should return correct action', () => {
    const result = clearHistory(true, false);

    expect(result.type).toBe('CLEAR_BROWSER_HISTORY');
    expect(result.metricsEnabled).toBe(true);
    expect(result.marketingEnabled).toBe(false);
    expect(result.id).toBe(1234567890);
  });

  it('addToWhitelist should return correct action', () => {
    expect(addToWhitelist('https://safe.com')).toStrictEqual({
      type: 'ADD_TO_BROWSER_WHITELIST',
      url: 'https://safe.com',
    });
  });

  it('closeAllTabs should return correct action', () => {
    expect(closeAllTabs()).toStrictEqual({ type: 'CLOSE_ALL_TABS' });
  });

  it('createNewTab should return correct action', () => {
    const result = createNewTab('https://example.com', 'dapp');

    expect(result.type).toBe('CREATE_NEW_TAB');
    expect(result.url).toBe('https://example.com');
    expect(result.linkType).toBe('dapp');
    expect(result.id).toBe(1234567890);
  });

  it('closeTab should return correct action', () => {
    expect(closeTab(42)).toStrictEqual({ type: 'CLOSE_TAB', id: 42 });
  });

  it('setActiveTab should return correct action', () => {
    expect(setActiveTab(42)).toStrictEqual({ type: 'SET_ACTIVE_TAB', id: 42 });
  });

  it('updateTab should return correct action', () => {
    const data = { isArchived: false, url: 'https://new.com', image: 'img.png' };

    expect(updateTab(42, data)).toStrictEqual({
      type: 'UPDATE_TAB',
      id: 42,
      data,
    });
  });

  it('storeFavicon should return correct action', () => {
    expect(storeFavicon({ origin: 'example.com', url: 'https://example.com/favicon.ico' })).toStrictEqual({
      type: 'STORE_FAVICON_URL',
      origin: 'example.com',
      url: 'https://example.com/favicon.ico',
    });
  });
});
