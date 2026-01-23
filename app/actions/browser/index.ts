export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
  ADD_TO_BROWSER_HISTORY: 'ADD_TO_BROWSER_HISTORY',
  CLEAR_BROWSER_HISTORY: 'CLEAR_BROWSER_HISTORY',
  ADD_TO_BROWSER_WHITELIST: 'ADD_TO_BROWSER_WHITELIST',
  CLOSE_ALL_TABS: 'CLOSE_ALL_TABS',
  CREATE_NEW_TAB: 'CREATE_NEW_TAB',
  CLOSE_TAB: 'CLOSE_TAB',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  UPDATE_TAB: 'UPDATE_TAB',
  STORE_FAVICON_URL: 'STORE_FAVICON_URL',
} as const;

export interface AddToViewedDappAction {
  type: typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

export interface AddToHistoryAction {
  type: typeof BrowserActionTypes.ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

export interface ClearHistoryAction {
  type: typeof BrowserActionTypes.CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

export interface AddToWhitelistAction {
  type: typeof BrowserActionTypes.ADD_TO_BROWSER_WHITELIST;
  url: string;
}

export interface CloseAllTabsAction {
  type: typeof BrowserActionTypes.CLOSE_ALL_TABS;
}

export interface CreateNewTabAction {
  type: typeof BrowserActionTypes.CREATE_NEW_TAB;
  url: string;
  linkType?: string;
  id: number;
}

export interface CloseTabAction {
  type: typeof BrowserActionTypes.CLOSE_TAB;
  id: number;
}

export interface SetActiveTabAction {
  type: typeof BrowserActionTypes.SET_ACTIVE_TAB;
  id: number;
}

export interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
}

export interface UpdateTabAction {
  type: typeof BrowserActionTypes.UPDATE_TAB;
  id: number;
  data: TabData;
}

export interface StoreFaviconAction {
  type: typeof BrowserActionTypes.STORE_FAVICON_URL;
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

export function addToViewedDapp(hostname: string): AddToViewedDappAction {
  return {
    type: BrowserActionTypes.ADD_TO_VIEWED_DAPP,
    hostname,
  };
}

export function addToHistory({
  url,
  name,
}: {
  url: string;
  name: string;
}): AddToHistoryAction {
  return {
    type: BrowserActionTypes.ADD_TO_BROWSER_HISTORY,
    url,
    name,
  };
}

export function clearHistory(
  metricsEnabled: boolean,
  marketingEnabled: boolean,
): ClearHistoryAction {
  return {
    type: BrowserActionTypes.CLEAR_BROWSER_HISTORY,
    id: Date.now(),
    metricsEnabled,
    marketingEnabled,
  };
}

export function addToWhitelist(url: string): AddToWhitelistAction {
  return {
    type: BrowserActionTypes.ADD_TO_BROWSER_WHITELIST,
    url,
  };
}

export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: BrowserActionTypes.CLOSE_ALL_TABS,
  };
}

export function createNewTab(
  url: string,
  linkType?: string,
): CreateNewTabAction {
  return {
    type: BrowserActionTypes.CREATE_NEW_TAB,
    url,
    linkType,
    id: Date.now(),
  };
}

export function closeTab(id: number): CloseTabAction {
  return {
    type: BrowserActionTypes.CLOSE_TAB,
    id,
  };
}

export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: BrowserActionTypes.SET_ACTIVE_TAB,
    id,
  };
}

export function updateTab(id: number, data: TabData): UpdateTabAction {
  return {
    type: BrowserActionTypes.UPDATE_TAB,
    id,
    data,
  };
}

export function storeFavicon({
  origin,
  url,
}: {
  origin: string;
  url: string;
}): StoreFaviconAction {
  return {
    type: BrowserActionTypes.STORE_FAVICON_URL,
    origin,
    url,
  };
}
