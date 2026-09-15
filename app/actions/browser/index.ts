/**
 * Browser actions for Redux
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
} as const;

export interface BrowserTab {
  id: number;
  url: string;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
}

export interface AddToViewedDappAction {
  type: typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

export interface AddToBrowserHistoryAction {
  type: 'ADD_TO_BROWSER_HISTORY';
  url: string;
  name: string;
}

export interface ClearBrowserHistoryAction {
  type: 'CLEAR_BROWSER_HISTORY';
  id: number;
  metricsEnabled: boolean | null;
  marketingEnabled: boolean | null;
}

export interface AddToBrowserWhitelistAction {
  type: 'ADD_TO_BROWSER_WHITELIST';
  url: string;
}

export interface CloseAllTabsAction {
  type: 'CLOSE_ALL_TABS';
}

export interface CreateNewTabAction {
  type: 'CREATE_NEW_TAB';
  url: string;
  linkType?: string;
  id: number;
}

export interface CloseTabAction {
  type: 'CLOSE_TAB';
  id: number;
}

export interface SetActiveTabAction {
  type: 'SET_ACTIVE_TAB';
  id: number;
}

export interface UpdateTabAction {
  type: 'UPDATE_TAB';
  id: number;
  data: Partial<Omit<BrowserTab, 'id'>>;
}

export interface StoreFaviconAction {
  type: 'STORE_FAVICON_URL';
  origin: string;
  url: string;
}

export type BrowserAction =
  | AddToViewedDappAction
  | AddToBrowserHistoryAction
  | ClearBrowserHistoryAction
  | AddToBrowserWhitelistAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconAction;

/**
 * Adds a new entry to viewed dapps
 *
 * @param {string} hostname - Dapp hostname
 * @returns
 */
export function addToViewedDapp(hostname: string): AddToViewedDappAction {
  return {
    type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
    hostname,
  };
}

/**
 * Adds a new entry to the browser history
 *
 * @param {Object} website - The website that has been visited
 * @param {string} website.url - The website's url
 * @param {string} website.name - The website name
 */
export function addToHistory({
  url,
  name,
}: Omit<AddToBrowserHistoryAction, 'type'>): AddToBrowserHistoryAction {
  return {
    type: 'ADD_TO_BROWSER_HISTORY',
    url,
    name,
  };
}

/**
 * Clears the entire browser history
 */
export function clearHistory(
  metricsEnabled: boolean | null,
  marketingEnabled: boolean | null,
): ClearBrowserHistoryAction {
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
 * @param {string} url - The website's url
 */
export function addToWhitelist(url: string): AddToBrowserWhitelistAction {
  return {
    type: 'ADD_TO_BROWSER_WHITELIST',
    url,
  };
}

/**
 * Closes all the opened tabs
 */
export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: 'CLOSE_ALL_TABS',
  };
}

/**
 * Creates a new tab
 *
 * @param {string} url - The website's url
 * @param {string} linkType - optional link type
 */
export function createNewTab(
  url: string,
  linkType?: string,
): CreateNewTabAction {
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
 * @param {number} id - The Tab ID
 */
export function closeTab(id: number): CloseTabAction {
  return {
    type: 'CLOSE_TAB',
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param {number} id - The Tab ID
 */
export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: 'SET_ACTIVE_TAB',
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param {number} id - The Tab ID
 * @param {Object} data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(
  id: number,
  data: Partial<Omit<BrowserTab, 'id'>>,
): UpdateTabAction {
  return {
    type: 'UPDATE_TAB',
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
 * @param {Object} favicon - favicon to store
 * @param {string} favicon.origin - the origin of the favicon as key
 * @param {string} favicon.url - the favicon image url
 * @returns {{favicon, type: string}}
 */
export function storeFavicon({
  origin,
  url,
}: Omit<StoreFaviconAction, 'type'>): StoreFaviconAction {
  return {
    type: 'STORE_FAVICON_URL',
    origin,
    url,
  };
}
