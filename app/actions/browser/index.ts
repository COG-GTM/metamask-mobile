import type { Action } from 'redux';

/**
 * Browser actions for Redux
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
} as const;

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface FaviconEntry {
  origin: string;
  url: string;
}

export interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
  [key: string]: unknown;
}

export interface AddToViewedDappAction
  extends Action<typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP> {
  hostname: string;
}

export interface AddToHistoryAction extends Action<'ADD_TO_BROWSER_HISTORY'> {
  url: string;
  name: string;
}

export interface ClearHistoryAction extends Action<'CLEAR_BROWSER_HISTORY'> {
  id: number;
  metricsEnabled: boolean | null | undefined;
  marketingEnabled: boolean | null | undefined;
}

export interface AddToWhitelistAction extends Action<'ADD_TO_BROWSER_WHITELIST'> {
  url: string;
}

export type CloseAllTabsAction = Action<'CLOSE_ALL_TABS'>;

export interface CreateNewTabAction extends Action<'CREATE_NEW_TAB'> {
  url: string;
  linkType?: string;
  id: number;
}

export interface CloseTabAction extends Action<'CLOSE_TAB'> {
  id: number;
}

export interface SetActiveTabAction extends Action<'SET_ACTIVE_TAB'> {
  id: number;
}

export interface UpdateTabAction extends Action<'UPDATE_TAB'> {
  id: number;
  data: TabData;
}

export interface StoreFaviconAction extends Action<'STORE_FAVICON_URL'> {
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
 */
export function addToHistory({
  url,
  name,
}: BrowserHistoryEntry): AddToHistoryAction {
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
  metricsEnabled: boolean | null | undefined,
  marketingEnabled: boolean | null | undefined,
): ClearHistoryAction {
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
export function addToWhitelist(url: string): AddToWhitelistAction {
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
 * @param url - The website's url
 * @param linkType - optional link type
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
 * Closes an existing tab
 *
 * @param id - The Tab ID
 */
export function closeTab(id: number): CloseTabAction {
  return {
    type: 'CLOSE_TAB',
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
    type: 'SET_ACTIVE_TAB',
    id,
  };
}

/**
 * Updates an existing tab
 *
 * @param id - The Tab ID
 * @param data - { isArchived: boolean, url: string, image: string }
 */
export function updateTab(id: number, data: TabData): UpdateTabAction {
  return {
    type: 'UPDATE_TAB',
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
 *
 * @param favicon - favicon to store
 */
export function storeFavicon({ origin, url }: FaviconEntry): StoreFaviconAction {
  return {
    type: 'STORE_FAVICON_URL',
    origin,
    url,
  };
}
