/**
 * Browser actions for Redux
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
};

/**
 * Adds a new entry to viewed dapps
 *
 * @param hostname - Dapp hostname
 * @returns
 */
export function addToViewedDapp(hostname: string) {
  return {
    type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
    hostname,
  };
}

/**
 * Adds a new entry to the browser history
 *
 * @param website - The website that has been visited
 * @param website.url - The website's url
 * @param website.name - The website name
 */
export function addToHistory({ url, name }: { url: string; name: string }) {
  return {
    type: 'ADD_TO_BROWSER_HISTORY',
    url,
    name,
  };
}

/**
 * Clears the entire browser history
 */
export function clearHistory(metricsEnabled: boolean, marketingEnabled: boolean) {
  return {
    type: 'CLEAR_BROWSER_HISTORY',
    id: Date.now(),
    metricsEnabled,
    marketingEnabled,
  };
}

/**
 * Adds a new entry to the whitelist
 *
 * @param url - The website's url
 */
export function addToWhitelist(url: string) {
  return {
    type: 'ADD_TO_BROWSER_WHITELIST',
    url,
  };
}

/**
 * Closes all the opened tabs
 */
export function closeAllTabs() {
  return {
    type: 'CLOSE_ALL_TABS',
  };
}

/**
 * Creates a new tab
 *
 * @param url - The website's url
 * @param linkType - optional link type
 */
export function createNewTab(url: string, linkType?: string) {
  return {
    type: 'CREATE_NEW_TAB',
    url,
    linkType,
    id: Date.now(),
  };
}

/**
 * Closes an exiting tab
 *
 * @param id - The Tab ID
 */
export function closeTab(id: number) {
  return {
    type: 'CLOSE_TAB',
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param id - The Tab ID
 */
export function setActiveTab(id: number) {
  return {
    type: 'SET_ACTIVE_TAB',
    id,
  };
}

interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
}

/**
 * Selects an exiting tab
 *
 * @param id - The Tab ID
 * @param data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(id: number, data: TabData) {
  return {
    type: 'UPDATE_TAB',
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
 * @param favicon - favicon to store
 * @param favicon.origin - the origin of the favicon as key
 * @param favicon.url - the favicon image url
 * @returns {{favicon, type: string}}
 */
export function storeFavicon({ origin, url }: { origin: string; url: string }) {
  return {
    type: 'STORE_FAVICON_URL',
    origin,
    url,
  };
}
