/* eslint-disable @typescript-eslint/default-param-last */
import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

interface BrowserHistoryEntry {
  url: string;
  name: string;
}

interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface FaviconEntry {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

const initialState: BrowserState = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  visitedDappsByHostname: {},
};

interface BrowserReducerAction {
  type: string;
  hostname?: string;
  url?: string;
  name?: string;
  metricsEnabled?: boolean;
  marketingEnabled?: boolean;
  id?: number;
  linkType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  origin?: string;
}

const browserReducer = (
  state: BrowserState = initialState,
  action: BrowserReducerAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      const { hostname } = action;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname as string]: true,
        },
      };
    }
    case 'ADD_TO_BROWSER_HISTORY': {
      const { url, name } = action;

      return {
        ...state,
        history: [
          ...state.history,
          { url: url as string, name: name as string },
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
              metricsEnabled: action.metricsEnabled,
              marketingEnabled: action.marketingEnabled,
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
            return { ...tab, ...action.data };
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
