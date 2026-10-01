export const ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP' as const;
export const ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY' as const;
export const CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY' as const;
export const ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST' as const;
export const CLOSE_ALL_TABS = 'CLOSE_ALL_TABS' as const;
export const CREATE_NEW_TAB = 'CREATE_NEW_TAB' as const;
export const CLOSE_TAB = 'CLOSE_TAB' as const;
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;
export const UPDATE_TAB = 'UPDATE_TAB' as const;
export const STORE_FAVICON_URL = 'STORE_FAVICON_URL' as const;

export const BrowserActionTypes = {
  ADD_TO_VIEWED_DAPP,
};

interface AddToViewedDappAction {
  type: typeof ADD_TO_VIEWED_DAPP;
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

interface UpdateTabData {
  isArchived?: boolean;
  url?: string;
  image?: string;
}

interface UpdateTabAction {
  type: typeof UPDATE_TAB;
  id: number;
  data: UpdateTabData;
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

export function addToViewedDapp(hostname: string): AddToViewedDappAction {
  return {
    type: ADD_TO_VIEWED_DAPP,
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
    type: ADD_TO_BROWSER_HISTORY,
    url,
    name,
  };
}

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

export function addToWhitelist(url: string): AddToWhitelistAction {
  return {
    type: ADD_TO_BROWSER_WHITELIST,
    url,
  };
}

export function closeAllTabs(): CloseAllTabsAction {
  return {
    type: CLOSE_ALL_TABS,
  };
}

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

export function closeTab(id: number): CloseTabAction {
  return {
    type: CLOSE_TAB,
    id,
  };
}

export function setActiveTab(id: number): SetActiveTabAction {
  return {
    type: SET_ACTIVE_TAB,
    id,
  };
}

export function updateTab(id: number, data: UpdateTabData): UpdateTabAction {
  return {
    type: UPDATE_TAB,
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
    type: STORE_FAVICON_URL,
    origin,
    url,
  };
}
