import { type Action } from 'redux';

/**
 * Browser action type enum
 */
export enum BrowserActionType {
  ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP',
  ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY',
  ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST',
  CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY',
  CLOSE_ALL_TABS = 'CLOSE_ALL_TABS',
  CREATE_NEW_TAB = 'CREATE_NEW_TAB',
  CLOSE_TAB = 'CLOSE_TAB',
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
  UPDATE_TAB = 'UPDATE_TAB',
  STORE_FAVICON_URL = 'STORE_FAVICON_URL',
}

/**
 * Browser history entry
 */
export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

/**
 * Browser tab state
 */
export interface BrowserTabState {
  url: string;
  id: number;
  linkType?: string;
  image?: string;
  isArchived?: boolean;
}

/**
 * Tab update data
 */
export interface TabUpdateData {
  url?: string;
  image?: string;
  isArchived?: boolean;
}

/**
 * Favicon entry
 */
export interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Browser actions
 */
export interface AddToViewedDappAction extends Action<BrowserActionType.ADD_TO_VIEWED_DAPP> {
  hostname: string;
}

export interface AddToBrowserHistoryAction extends Action<BrowserActionType.ADD_TO_BROWSER_HISTORY> {
  url: string;
  name: string;
}

export interface AddToBrowserWhitelistAction extends Action<BrowserActionType.ADD_TO_BROWSER_WHITELIST> {
  url: string;
}

export interface ClearBrowserHistoryAction extends Action<BrowserActionType.CLEAR_BROWSER_HISTORY> {
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

export type CloseAllTabsAction = Action<BrowserActionType.CLOSE_ALL_TABS>;

export interface CreateNewTabAction extends Action<BrowserActionType.CREATE_NEW_TAB> {
  url: string;
  id: number;
  linkType?: string;
}

export interface CloseTabAction extends Action<BrowserActionType.CLOSE_TAB> {
  id: number;
}

export interface SetActiveTabAction extends Action<BrowserActionType.SET_ACTIVE_TAB> {
  id: number;
}

export interface UpdateTabAction extends Action<BrowserActionType.UPDATE_TAB> {
  id: number;
  data: TabUpdateData;
}

export interface StoreFaviconUrlAction extends Action<BrowserActionType.STORE_FAVICON_URL> {
  origin: string;
  url: string;
}

/**
 * Browser actions union type
 */
export type BrowserAction =
  | AddToViewedDappAction
  | AddToBrowserHistoryAction
  | AddToBrowserWhitelistAction
  | ClearBrowserHistoryAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconUrlAction;
