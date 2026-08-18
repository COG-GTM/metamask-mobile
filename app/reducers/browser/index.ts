import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  [key: string]: unknown;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
  // Keep track of viewed Dapps, which is used for MetaMetricsEvents.DAPP_VIEWED event
  visitedDappsByHostname?: Record<string, boolean>;
}

interface BrowserReducerAction {
  type: string;
  hostname?: string;
  url?: string;
  name?: string;
  metricsEnabled?: boolean;
  marketingEnabled?: boolean;
  id?: number;
  linkType?: string;
  data?: object;
  origin?: string;
}

/* eslint-disable @typescript-eslint/default-param-last */
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
  action: BrowserReducerAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [action.hostname as string]: true,
        },
      };
    }
    case 'ADD_TO_BROWSER_HISTORY': {
      return {
        ...state,
        history: [
          ...state.history,
          { url: action.url as string, name: action.name as string },
        ].slice(-50),
      };
    }
    case 'ADD_TO_BROWSER_WHITELIST':
      return {
        ...state,
        whitelist: [...state.whitelist, action.url as string],
      };
    case 'CLEAR_BROWSER_HISTORY':
      return {
        ...state,
        history: [],
        favicons: [],
        tabs: [
          {
            url: appendURLParams(AppConstants.HOMEPAGE_URL, {
              metricsEnabled: action.metricsEnabled as boolean,
              marketingEnabled: action.marketingEnabled as boolean,
            }).href,
            id: action.id as number,
          },
        ],
        activeTab: action.id as number,
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
            url: action.url as string,
            ...(action.linkType && { linkType: action.linkType }),
            id: action.id as number,
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
        activeTab: action.id as number,
      };
    case 'UPDATE_TAB':
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...(action.data ?? {}) };
          }
          return { ...tab };
        }),
      };
    case 'STORE_FAVICON_URL':
      return {
        ...state,
        favicons: [
          { origin: action.origin as string, url: action.url as string },
          ...state.favicons,
        ].slice(0, AppConstants.FAVICON_CACHE_MAX_SIZE),
      };
    default:
      return state;
  }
};
export default browserReducer;
