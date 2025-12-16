export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP: 'ADD_TO_VIEWED_DAPP',
} as const;

interface TabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
}

interface AddToViewedDappAction {
  type: typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

interface AddToHistoryAction {
  type: 'ADD_TO_BROWSER_HISTORY';
  url: string;
  name: string;
}

interface ClearHistoryAction {
  type: 'CLEAR_BROWSER_HISTORY';
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

interface AddToWhitelistAction {
  type: 'ADD_TO_BROWSER_WHITELIST';
  url: string;
}

interface CloseAllTabsAction {
  type: 'CLOSE_ALL_TABS';
}

interface CreateNewTabAction {
  type: 'CREATE_NEW_TAB';
  url: string;
  linkType?: string;
  id: number;
}

interface CloseTabAction {
  type: 'CLOSE_TAB';
  id: number;
}

interface SetActiveTabAction {
  type: 'SET_ACTIVE_TAB';
  id: number;
}

interface UpdateTabAction {
  type: 'UPDATE_TAB';
  id: number;
  data: TabData;
}

interface StoreFaviconAction {
  type: 'STORE_FAVICON_URL';
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
    type: 'ADD_TO_BROWSER_HISTORY',
    url,
    name,
  };
}

export function clearHistory(
  metricsEnabled: boolean,
  marketingEnabled: boolean,
): ClearHistoryAction {
  return {
    type: 'CLEAR_BROWSER_HISTORY',
    id: Date.now(),
    metricsEnabled,
    marketingEnabled,
  };
}

export function addToWhitelist(url: string): AddToWhitelistAction {
  return {
    type: 'ADD_TO_BROWSER_WHITELIST',
    url,
  };
}

export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: 'CLOSE_ALL_TABS',
  };
}

export function createNewTab(url: string, linkType?: string): CreateNewTabAction {
  return {
    type: 'CREATE_NEW_TAB',
    url,
    linkType,
    id: Date.now(),
  };
}

export function closeTab(id: number): CloseTabAction {
  return {
    type: 'CLOSE_TAB',
    id,
  };
}

export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: 'SET_ACTIVE_TAB',
    id,
  };
}

export function updateTab(id: number, data: TabData): UpdateTabAction {
  return {
    type: 'UPDATE_TAB',
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
    type: 'STORE_FAVICON_URL',
    origin,
    url,
  };
}
