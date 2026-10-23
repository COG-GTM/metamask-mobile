/**
 * Browser actions for Redux
 */
export enum ActionType {
  ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP',
  ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY',
  CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY',
  ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST',
  CLOSE_ALL_TABS = 'CLOSE_ALL_TABS',
  CREATE_NEW_TAB = 'CREATE_NEW_TAB',
  CLOSE_TAB = 'CLOSE_TAB',
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
  UPDATE_TAB = 'UPDATE_TAB',
  STORE_FAVICON_URL = 'STORE_FAVICON_URL',
}

export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: ActionType.ADD_TO_VIEWED_DAPP,
} as const;

export interface BrowserTabData {
  url?: string;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
  [key: string]: unknown;
}

export interface AddToViewedDappAction {
  type: ActionType.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

export interface AddToHistoryAction {
  type: ActionType.ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

export interface ClearHistoryAction {
  type: ActionType.CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean | null;
}

export interface AddToWhitelistAction {
  type: ActionType.ADD_TO_BROWSER_WHITELIST;
  url: string;
}

export interface CloseAllTabsAction {
  type: ActionType.CLOSE_ALL_TABS;
}

export interface CreateNewTabAction {
  type: ActionType.CREATE_NEW_TAB;
  url: string;
  linkType: string | undefined;
  id: number;
}

export interface CloseTabAction {
  type: ActionType.CLOSE_TAB;
  id: number;
}

export interface SetActiveTabAction {
  type: ActionType.SET_ACTIVE_TAB;
  id: number;
}

export interface UpdateTabAction {
  type: ActionType.UPDATE_TAB;
  id: number;
  data: BrowserTabData;
}

export interface StoreFaviconAction {
  type: ActionType.STORE_FAVICON_URL;
  origin: string;
  url: string;
}

export type Action =
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
    type: ActionType.ADD_TO_BROWSER_HISTORY,
    url,
    name,
  };
}

/**
 * Clears the entire browser history
 */
export function clearHistory(
  metricsEnabled: boolean,
  marketingEnabled: boolean | null,
): ClearHistoryAction {
  return {
    type: ActionType.CLEAR_BROWSER_HISTORY,
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
    type: ActionType.ADD_TO_BROWSER_WHITELIST,
    url,
  };
}

/**
 * Closes all the opened tabs
 */
export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: ActionType.CLOSE_ALL_TABS,
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
    type: ActionType.CREATE_NEW_TAB,
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
export function closeTab(id: number): CloseTabAction {
  return {
    type: ActionType.CLOSE_TAB,
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param id - The Tab ID
 */
export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: ActionType.SET_ACTIVE_TAB,
    id,
  };
}

/**
 * Selects an exiting tab
 *
 * @param id - The Tab ID
 * @param data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(id: number, data: BrowserTabData): UpdateTabAction {
  return {
    type: ActionType.UPDATE_TAB,
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
    type: ActionType.STORE_FAVICON_URL,
    origin,
    url,
  };
}
