import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

interface HistoryEntry {
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

interface BrowserState {
  history: HistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

interface AddToViewedDappAction {
  type: 'ADD_TO_VIEWED_DAPP';
  hostname: string;
}

interface AddToHistoryAction {
  type: 'ADD_TO_BROWSER_HISTORY';
  url: string;
  name: string;
}

interface AddToWhitelistAction {
  type: 'ADD_TO_BROWSER_WHITELIST';
  url: string;
}

interface ClearHistoryAction {
  type: 'CLEAR_BROWSER_HISTORY';
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
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
  data: Partial<BrowserTab>;
}

interface StoreFaviconAction {
  type: 'STORE_FAVICON_URL';
  origin: string;
  url: string;
}

type BrowserAction =
  | AddToViewedDappAction
  | AddToHistoryAction
  | AddToWhitelistAction
  | ClearHistoryAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconAction;

const initialState: BrowserState = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  visitedDappsByHostname: {},
};
const browserReducer = (
  state: BrowserState = initialState,
  action: BrowserAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      const { hostname } = action as AddToViewedDappAction;
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
