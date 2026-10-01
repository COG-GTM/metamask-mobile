/* eslint-disable @typescript-eslint/default-param-last */
import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

// TODO: import from actions when migrated
type AddToViewedDappAction = {
  type: 'ADD_TO_VIEWED_DAPP';
  hostname: string;
};

type AddToBrowserHistoryAction = {
  type: 'ADD_TO_BROWSER_HISTORY';
  url: string;
  name: string;
};

type AddToBrowserWhitelistAction = {
  type: 'ADD_TO_BROWSER_WHITELIST';
  url: string;
};

type ClearBrowserHistoryAction = {
  type: 'CLEAR_BROWSER_HISTORY';
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
};

type CloseAllTabsAction = {
  type: 'CLOSE_ALL_TABS';
};

type CreateNewTabAction = {
  type: 'CREATE_NEW_TAB';
  url: string;
  linkType?: string;
  id: number;
};

type CloseTabAction = {
  type: 'CLOSE_TAB';
  id: number;
};

type SetActiveTabAction = {
  type: 'SET_ACTIVE_TAB';
  id: number;
};

type UpdateTabAction = {
  type: 'UPDATE_TAB';
  id: number;
  data: Partial<BrowserTab>;
};

type StoreFaviconUrlAction = {
  type: 'STORE_FAVICON_URL';
  origin: string;
  url: string;
};

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

interface BrowserHistoryEntry {
  url: string;
  name: string;
}

interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

interface Favicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

const initialState: BrowserState = {
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
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP as 'ADD_TO_VIEWED_DAPP': {
      const { hostname } = action;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname]: true,
        },
      };
    }
    case 'ADD_TO_BROWSER_HISTORY': {
      const { url, name } = action;

      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case 'ADD_TO_BROWSER_WHITELIST':
      return {
        ...state,
        whitelist: [...state.whitelist, action.url],
      };
    case 'CLEAR_BROWSER_HISTORY':
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
    case 'CLOSE_ALL_TABS':
      return {
        ...state,
        tabs: [],
      };
    case 'CREATE_NEW_TAB':
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
    case 'CLOSE_TAB':
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.id),
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.id,
      };
    case 'UPDATE_TAB':
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      };
    case 'STORE_FAVICON_URL':
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
