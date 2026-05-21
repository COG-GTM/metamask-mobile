/* eslint-disable @typescript-eslint/default-param-last */
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

const ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP' as const;
const ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY' as const;
const ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST' as const;
const CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY' as const;
const CLOSE_ALL_TABS = 'CLOSE_ALL_TABS' as const;
const CREATE_NEW_TAB = 'CREATE_NEW_TAB' as const;
const CLOSE_TAB = 'CLOSE_TAB' as const;
const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;
const UPDATE_TAB = 'UPDATE_TAB' as const;
const STORE_FAVICON_URL = 'STORE_FAVICON_URL' as const;

interface BrowserHistoryEntry {
  url: string;
  name: string;
}

interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  [key: string]: unknown;
}

interface Favicon {
  origin: string;
  url: string;
}

interface AddToViewedDappAction {
  type: typeof ADD_TO_VIEWED_DAPP;
  hostname: string;
}

interface AddToBrowserHistoryAction {
  type: typeof ADD_TO_BROWSER_HISTORY;
  url: string;
  name: string;
}

interface AddToBrowserWhitelistAction {
  type: typeof ADD_TO_BROWSER_WHITELIST;
  url: string;
}

interface ClearBrowserHistoryAction {
  type: typeof CLEAR_BROWSER_HISTORY;
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

interface CloseAllTabsAction {
  type: typeof CLOSE_ALL_TABS;
}

interface CreateNewTabAction {
  type: typeof CREATE_NEW_TAB;
  url: string;
  id: number;
  linkType?: string;
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
  data: Partial<BrowserTab>;
}

interface StoreFaviconUrlAction {
  type: typeof STORE_FAVICON_URL;
  origin: string;
  url: string;
}

type BrowserAction =
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

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

const initialState: Readonly<BrowserState> = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  // Keep track of viewed Dapps, which is used for MetaMetricsEvents.DAPP_VIEWED event
  visitedDappsByHostname: {},
};
const browserReducer = (
  state: BrowserState = initialState,
  action: BrowserAction,
): BrowserState => {
  switch (action.type) {
    case ADD_TO_VIEWED_DAPP: {
      const { hostname } = action;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname]: true,
        },
      };
    }
    case ADD_TO_BROWSER_HISTORY: {
      const { url, name } = action;

      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case ADD_TO_BROWSER_WHITELIST:
      return {
        ...state,
        whitelist: [...state.whitelist, action.url],
      };
    case CLEAR_BROWSER_HISTORY:
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
    case CLOSE_ALL_TABS:
      return {
        ...state,
        tabs: [],
      };
    case CREATE_NEW_TAB:
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
    case CLOSE_TAB:
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.id),
      };
    case SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.id,
      };
    case UPDATE_TAB:
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      };
    case STORE_FAVICON_URL:
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
