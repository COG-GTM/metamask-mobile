import { Action } from 'redux';
import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: string;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
}

export interface Favicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: string | null;
  visitedDappsByHostname: Record<string, boolean>;
}

interface AddToViewedDappAction extends Action<typeof BrowserActionTypes.ADD_TO_VIEWED_DAPP> {
  hostname: string;
}

interface AddToBrowserHistoryAction extends Action<'ADD_TO_BROWSER_HISTORY'> {
  url: string;
  name: string;
}

interface AddToBrowserWhitelistAction extends Action<'ADD_TO_BROWSER_WHITELIST'> {
  url: string;
}

interface ClearBrowserHistoryAction extends Action<'CLEAR_BROWSER_HISTORY'> {
  id: string;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
}

interface CloseAllTabsAction extends Action<'CLOSE_ALL_TABS'> {}

interface CreateNewTabAction extends Action<'CREATE_NEW_TAB'> {
  url: string;
  linkType?: string;
  id: string;
}

interface CloseTabAction extends Action<'CLOSE_TAB'> {
  id: string;
}

interface SetActiveTabAction extends Action<'SET_ACTIVE_TAB'> {
  id: string;
}

interface UpdateTabAction extends Action<'UPDATE_TAB'> {
  id: string;
  data: Partial<BrowserTab>;
}

interface StoreFaviconUrlAction extends Action<'STORE_FAVICON_URL'> {
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
  | StoreFaviconUrlAction
  | Action<string>;

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
      const { url, name } = action as AddToBrowserHistoryAction;

      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case 'ADD_TO_BROWSER_WHITELIST':
      return {
        ...state,
        whitelist: [...state.whitelist, (action as AddToBrowserWhitelistAction).url],
      };
    case 'CLEAR_BROWSER_HISTORY': {
      const clearAction = action as ClearBrowserHistoryAction;
      return {
        ...state,
        history: [],
        favicons: [],
        tabs: [
          {
            url: appendURLParams(AppConstants.HOMEPAGE_URL, {
              metricsEnabled: clearAction.metricsEnabled,
              marketingEnabled: clearAction.marketingEnabled,
            }).href,
            id: clearAction.id,
          },
        ],
        activeTab: clearAction.id,
      };
    }
    case 'CLOSE_ALL_TABS':
      return {
        ...state,
        tabs: [],
      };
    case 'CREATE_NEW_TAB': {
      const createAction = action as CreateNewTabAction;
      return {
        ...state,
        tabs: [
          ...state.tabs,
          {
            url: createAction.url,
            ...(createAction.linkType && { linkType: createAction.linkType }),
            id: createAction.id,
          },
        ],
      };
    }
    case 'CLOSE_TAB':
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== (action as CloseTabAction).id),
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: (action as SetActiveTabAction).id,
      };
    case 'UPDATE_TAB': {
      const updateAction = action as UpdateTabAction;
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === updateAction.id) {
            return { ...tab, ...updateAction.data };
          }
          return { ...tab };
        }),
      };
    }
    case 'STORE_FAVICON_URL': {
      const faviconAction = action as StoreFaviconUrlAction;
      return {
        ...state,
        favicons: [
          { origin: faviconAction.origin, url: faviconAction.url },
          ...state.favicons,
        ].slice(0, AppConstants.FAVICON_CACHE_MAX_SIZE),
      };
    }
    default:
      return state;
  }
};
export default browserReducer;
