/**
 * Browser actions for Redux
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
} as const;

export const ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY' as const;
export const CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY' as const;
export const ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST' as const;
export const CLOSE_ALL_TABS = 'CLOSE_ALL_TABS' as const;
export const CREATE_NEW_TAB = 'CREATE_NEW_TAB' as const;
export const CLOSE_TAB = 'CLOSE_TAB' as const;
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;
export const UPDATE_TAB = 'UPDATE_TAB' as const;
export const STORE_FAVICON_URL = 'STORE_FAVICON_URL' as const;

interface AddToViewedDappAction {
  type: typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

interface AddToHistoryAction {
  type: typeof ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

interface ClearHistoryAction {
  type: typeof CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

interface AddToWhitelistAction {
  type: typeof ADD_TO_BROWSER_WHITELIST;
  url: string;
}

interface CloseAllTabsAction {
  type: typeof CLOSE_ALL_TABS;
}

interface CreateNewTabAction {
  type: typeof CREATE_NEW_TAB;
  url: string;
  linkType?: string;
  id: number;
}

interface CloseTabAction {
  type: typeof CLOSE_TAB;
  id: number;
}

interface SetActiveTabAction {
  type: typeof SET_ACTIVE_TAB;
  id: number;
}

interface UpdateTabAction {
  type: typeof UPDATE_TAB;
  id: number;
  data: { isArchived?: boolean; url?: string; image?: string };
}

interface StoreFaviconAction {
  type: typeof STORE_FAVICON_URL;
  origin: string;
  url: string;
}

export type BrowserAction =
  | AddToViewedDappAction
  | AddToHistoryAction
  | ClearHistoryAction
  | AddToWhitelistAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconAction;

/**
 * Adds a new entry to viewed dapps
 *
 * @param hostname - Dapp hostname
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
 * @param website - The website that has been visited
 * @param website.url - The website's url
 * @param website.name - The website name
 */
export function addToHistory({
  url,
  name,
}: {
  url: string;
  name: string;
}): AddToHistoryAction {
  return {
    type: ADD_TO_BROWSER_HISTORY,
    url,
    name,
  };
}

/**
 * Clears the entire browser history
 */
export function clearHistory(
  metricsEnabled: boolean,
  marketingEnabled: boolean,
): ClearHistoryAction {
  return {
    type: CLEAR_BROWSER_HISTORY,
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
export function addToWhitelist(url: string): AddToWhitelistAction {
  return {
    type: ADD_TO_BROWSER_WHITELIST,
    url,
  };
}

/**
 * Closes all the opened tabs
 */
export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: CLOSE_ALL_TABS,
  };
}

/**
 * Creates a new tab
 *
 * @param url - The website's url
 * @param linkType - optional link type
 */
export function createNewTab(
  url: string,
  linkType?: string,
): CreateNewTabAction {
  return {
    type: CREATE_NEW_TAB,
    url,
    linkType,
    id: Date.now(),
  };
}

/**
 * Closes an existing tab
 *
 * @param id - The Tab ID
 */
export function closeTab(id: number): CloseTabAction {
  return {
    type: CLOSE_TAB,
    id,
  };
}

/**
 * Selects an existing tab
 *
 * @param id - The Tab ID
 */
export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: SET_ACTIVE_TAB,
    id,
  };
}

/**
 * Updates an existing tab
 *
 * @param id - The Tab ID
 * @param data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(
  id: number,
  data: { isArchived?: boolean; url?: string; image?: string },
): UpdateTabAction {
  return {
    type: UPDATE_TAB,
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
 * @param favicon - favicon to store
 * @param favicon.origin - the origin of the favicon as key
 * @param favicon.url - the favicon image url
 */
export function storeFavicon({
  origin,
  url,
}: {
  origin: string;
  url: string;
}): StoreFaviconAction {
  return {
    type: STORE_FAVICON_URL,
    origin,
    url,
  };
}
