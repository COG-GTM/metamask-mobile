import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

export interface BrowserHistoryItem {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: string;
  linkType?: string;
  image?: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryItem[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: string | null;
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

interface BrowserAction {
  type: string;
  hostname?: string;
  url?: string;
  name?: string;
  id?: string | number;
  linkType?: string;
  data?: Partial<BrowserTab>;
  origin?: string;
  metricsEnabled?: boolean;
  marketingEnabled?: boolean;
  show?: boolean | null;
}

const browserReducer = (
  state: BrowserState = initialState,
  action: BrowserAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      const { hostname } = action;
      if (!hostname) {
        return state;
      }
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
      if (!url || !name) {
        return state;
      }
      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case 'ADD_TO_BROWSER_WHITELIST':
      if (!action.url) {
        return state;
      }
      return {
        ...state,
        whitelist: [...state.whitelist, action.url],
      };
    case 'CLEAR_BROWSER_HISTORY': {
      const tabId = action.id !== undefined ? String(action.id) : '';
      const params: Record<string, string | number | boolean> = {};
      if (action.metricsEnabled !== undefined) {
        params.metricsEnabled = action.metricsEnabled;
      }
      if (action.marketingEnabled !== undefined) {
        params.marketingEnabled = action.marketingEnabled;
      }
      return {
        ...state,
        history: [],
        favicons: [],
        tabs: [
          {
            url: appendURLParams(AppConstants.HOMEPAGE_URL, params).href,
            id: tabId,
          },
        ],
        activeTab: tabId || null,
      };
    }
    case 'CLOSE_ALL_TABS':
      return {
        ...state,
        tabs: [],
      };
    case 'CREATE_NEW_TAB':
      if (action.id === undefined) {
        return state;
      }
      return {
        ...state,
        tabs: [
          ...state.tabs,
          {
            url: action.url ?? '',
            ...(action.linkType && { linkType: action.linkType }),
            id: String(action.id),
          },
        ],
      };
    case 'CLOSE_TAB': {
      const closeId = action.id !== undefined ? String(action.id) : '';
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== closeId),
      };
    }
    case 'SET_ACTIVE_TAB': {
      const activeId =
        action.id !== undefined ? String(action.id) : null;
      return {
        ...state,
        activeTab: activeId,
      };
    }
    case 'UPDATE_TAB': {
      const updateId = action.id !== undefined ? String(action.id) : '';
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === updateId) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      };
    }
    case 'STORE_FAVICON_URL':
      if (!action.origin || !action.url) {
        return state;
      }
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
