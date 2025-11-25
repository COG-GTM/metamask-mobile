/**
 * Browser actions for Redux
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
} as const;

// Type definitions
interface WebsiteEntry {
  url: string;
  name: string;
}

interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
}

interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Adds a new entry to viewed dapps
 *
 * @param hostname - Dapp hostname
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
 */
export function addToHistory({ url, name }: WebsiteEntry) {
  return {
    type: 'ADD_TO_BROWSER_HISTORY' as const,
    url,
    name,
  };
}

/**
 * Clears the entire browser history
 */
export function clearHistory(metricsEnabled: boolean, marketingEnabled: boolean) {
  return {
    type: 'CLEAR_BROWSER_HISTORY' as const,
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
    type: 'ADD_TO_BROWSER_WHITELIST' as const,
    url,
  };
}

/**
 * Closes all the opened tabs
 */
export function closeAllTabs() {
  return {
    type: 'CLOSE_ALL_TABS' as const,
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
    type: 'CREATE_NEW_TAB' as const,
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
    type: 'CLOSE_TAB' as const,
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
    type: 'SET_ACTIVE_TAB' as const,
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param id - The Tab ID
 * @param data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(id: number, data: TabData) {
  return {
    type: 'UPDATE_TAB' as const,
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
 * @param favicon - favicon to store
 */
export function storeFavicon({ origin, url }: FaviconEntry) {
  return {
    type: 'STORE_FAVICON_URL' as const,
    origin,
    url,
  };
}
