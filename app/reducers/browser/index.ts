import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

/**
 * Browser action types
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
 * Browser tab interface
 */
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
}

/**
 * Browser history entry interface
 */
export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

/**
 * Favicon entry interface
 */
export interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Browser state interface
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

/**
 * Browser action interfaces
 */
interface AddToViewedDappAction {
  type: BrowserActionType.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

interface AddToBrowserHistoryAction {
  type: BrowserActionType.ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

interface AddToBrowserWhitelistAction {
  type: BrowserActionType.ADD_TO_BROWSER_WHITELIST;
  url: string;
}

interface ClearBrowserHistoryAction {
  type: BrowserActionType.CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

interface CloseAllTabsAction {
  type: BrowserActionType.CLOSE_ALL_TABS;
}

interface CreateNewTabAction {
  type: BrowserActionType.CREATE_NEW_TAB;
  url: string;
  linkType?: string;
  id: number;
}

interface CloseTabAction {
  type: BrowserActionType.CLOSE_TAB;
  id: number;
}

interface SetActiveTabAction {
  type: BrowserActionType.SET_ACTIVE_TAB;
  id: number;
}

interface UpdateTabAction {
  type: BrowserActionType.UPDATE_TAB;
  id: number;
  data: Partial<BrowserTab>;
}

interface StoreFaviconUrlAction {
  type: BrowserActionType.STORE_FAVICON_URL;
  origin: string;
  url: string;
}

/**
 * Union type of all browser actions
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

/**
 * Initial browser state
 */
export const browserInitialState: BrowserState = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  visitedDappsByHostname: {},
};

/**
 * Browser reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const browserReducer = (
  state: BrowserState = browserInitialState,
  action: BrowserAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionType.ADD_TO_VIEWED_DAPP: {
      const { hostname } = action;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname]: true,
        },
      };
    }
    case BrowserActionType.ADD_TO_BROWSER_HISTORY: {
      const { url, name } = action;
      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case BrowserActionType.ADD_TO_BROWSER_WHITELIST:
      return {
        ...state,
        whitelist: [...state.whitelist, action.url],
      };
    case BrowserActionType.CLEAR_BROWSER_HISTORY:
      return {
        ...state,
        history: [],
        favicons: [],
        tabs: [
          {
            url: appendURLParams(AppConstants.HOMEPAGE_URL, {
              metricsEnabled: action.metricsEnabled,
              marketingEnabled: action.marketingEnabled,
            }).href,
            id: action.id,
          },
        ],
        activeTab: action.id,
      };
    case BrowserActionType.CLOSE_ALL_TABS:
      return {
        ...state,
        tabs: [],
      };
    case BrowserActionType.CREATE_NEW_TAB:
      return {
        ...state,
        tabs: [
          ...state.tabs,
          {
            url: action.url,
            ...(action.linkType && { linkType: action.linkType }),
            id: action.id,
          },
        ],
      };
    case BrowserActionType.CLOSE_TAB:
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.id),
      };
    case BrowserActionType.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.id,
      };
    case BrowserActionType.UPDATE_TAB:
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      };
    case BrowserActionType.STORE_FAVICON_URL:
      return {
        ...state,
        favicons: [
          { origin: action.origin, url: action.url },
          ...state.favicons,
        ].slice(0, AppConstants.FAVICON_CACHE_MAX_SIZE),
      };
    default:
      return state;
  }
};

export default browserReducer;
