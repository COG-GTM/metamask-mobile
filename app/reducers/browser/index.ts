import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

/**
 * Represents a history entry
 */
export interface HistoryEntry {
  url: string;
  name: string;
}

/**
 * Represents a browser tab
 */
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
}

/**
 * Represents a favicon entry
 */
export interface Favicon {
  origin: string;
  url: string;
}

/**
 * State shape for the browser reducer
 */
export interface BrowserState {
  history: HistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

/**
 * Action types for browser reducer
 */
interface AddToViewedDappAction {
  type: typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP;
  hostname: string;
}

interface AddToBrowserHistoryAction {
  type: 'ADD_TO_BROWSER_HISTORY';
  url: string;
  name: string;
}

interface AddToBrowserWhitelistAction {
  type: 'ADD_TO_BROWSER_WHITELIST';
  url: string;
}

interface ClearBrowserHistoryAction {
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
  id: number;
  linkType?: string;
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

interface StoreFaviconUrlAction {
  type: 'STORE_FAVICON_URL';
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
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      const typedAction = action as AddToViewedDappAction;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [typedAction.hostname]: true,
        },
      };
    }
    case 'ADD_TO_BROWSER_HISTORY': {
      const typedAction = action as AddToBrowserHistoryAction;
      return {
        ...state,
        history: [...state.history, { url: typedAction.url, name: typedAction.name }].slice(-50),
      };
    }
    case 'ADD_TO_BROWSER_WHITELIST': {
      const typedAction = action as AddToBrowserWhitelistAction;
      return {
        ...state,
        whitelist: [...state.whitelist, typedAction.url],
      };
    }
    case 'CLEAR_BROWSER_HISTORY': {
      const typedAction = action as ClearBrowserHistoryAction;
      return {
        ...state,
        history: [],
        favicons: [],
        tabs: [
          {
            url: appendURLParams(AppConstants.HOMEPAGE_URL, {
              metricsEnabled: typedAction.metricsEnabled,
              marketingEnabled: typedAction.marketingEnabled,
            }).href,
            id: typedAction.id,
          },
        ],
        activeTab: typedAction.id,
      };
    }
    case 'CLOSE_ALL_TABS':
      return {
        ...state,
        tabs: [],
      };
    case 'CREATE_NEW_TAB': {
      const typedAction = action as CreateNewTabAction;
      return {
        ...state,
        tabs: [
          ...state.tabs,
          {
            url: typedAction.url,
            ...(typedAction.linkType && { linkType: typedAction.linkType }),
            id: typedAction.id,
          },
        ],
      };
    }
    case 'CLOSE_TAB': {
      const typedAction = action as CloseTabAction;
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== typedAction.id),
      };
    }
    case 'SET_ACTIVE_TAB': {
      const typedAction = action as SetActiveTabAction;
      return {
        ...state,
        activeTab: typedAction.id,
      };
    }
    case 'UPDATE_TAB': {
      const typedAction = action as UpdateTabAction;
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === typedAction.id) {
            return { ...tab, ...typedAction.data };
          }
          return { ...tab };
        }),
      };
    }
    case 'STORE_FAVICON_URL': {
      const typedAction = action as StoreFaviconUrlAction;
      return {
        ...state,
        favicons: [
          { origin: typedAction.origin, url: typedAction.url },
          ...state.favicons,
        ].slice(0, AppConstants.FAVICON_CACHE_MAX_SIZE),
      };
    }
    default:
      return state;
  }
};

export default browserReducer;
