import type { Action as ReduxAction } from 'redux';

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

/**
 * @deprecated Use ActionType from this module instead.
 */
export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: ActionType.ADD_TO_VIEWED_DAPP,
} as const;

export interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
  [key: string]: unknown;
}

export interface AddToViewedDappAction
  extends ReduxAction<ActionType.ADD_TO_VIEWED_DAPP> {
  hostname: string;
}

export interface AddToHistoryAction
  extends ReduxAction<ActionType.ADD_TO_BROWSER_HISTORY> {
  url: string;
  name: string;
}

export interface ClearHistoryAction
  extends ReduxAction<ActionType.CLEAR_BROWSER_HISTORY> {
  id: number;
  metricsEnabled: boolean | null;
  marketingEnabled: boolean | null;
}

export interface AddToWhitelistAction
  extends ReduxAction<ActionType.ADD_TO_BROWSER_WHITELIST> {
  url: string;
}

export interface CloseAllTabsAction
  extends ReduxAction<ActionType.CLOSE_ALL_TABS> {}

export interface CreateNewTabAction
  extends ReduxAction<ActionType.CREATE_NEW_TAB> {
  url: string;
  linkType?: string;
  id: number;
}

export interface CloseTabAction extends ReduxAction<ActionType.CLOSE_TAB> {
  id: number;
}

export interface SetActiveTabAction
  extends ReduxAction<ActionType.SET_ACTIVE_TAB> {
  id: number;
}

export interface UpdateTabAction extends ReduxAction<ActionType.UPDATE_TAB> {
  id: number;
  data: TabData;
}

export interface StoreFaviconAction
  extends ReduxAction<ActionType.STORE_FAVICON_URL> {
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
 */
export function addToViewedDapp(hostname: string): AddToViewedDappAction {
  return {
    type: ActionType.ADD_TO_VIEWED_DAPP,
    hostname,
  };
}

/**
 * Adds a new entry to the browser history
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
  metricsEnabled: boolean | null,
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
 * Closes an existing tab
 */
export function closeTab(id: number): CloseTabAction {
  return {
    type: ActionType.CLOSE_TAB,
    id,
  };
}

/**
 * Selects an existing tab
 */
export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: ActionType.SET_ACTIVE_TAB,
    id,
  };
}

/**
 * Updates an existing tab
 */
export function updateTab(id: number, data: TabData): UpdateTabAction {
  return {
    type: ActionType.UPDATE_TAB,
    id,
    data,
  };
}

/**
 * Stores the favicon url using the origin as key
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
