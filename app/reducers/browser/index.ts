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
  image?: string;
  isArchived?: boolean;
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
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}

interface BrowserActionBase {
  type: string;
  hostname?: string;
  url?: string;
  name?: string;
  id?: number;
  metricsEnabled?: boolean;
  marketingEnabled?: boolean;
  linkType?: string;
  data?: Partial<BrowserTab>;
  origin?: string;
  show?: boolean | null;
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
  action: BrowserActionBase = { type: '' },
): BrowserState => {
  switch (action.type) {
    case BrowserActionTypes.ADD_TO_VIEWED_DAPP: {
      const hostname = action.hostname as string;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname]: true,
        },
      };
    }
    case 'ADD_TO_BROWSER_HISTORY': {
      const url = action.url as string;
      const name = action.name as string;

      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
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
        tabs: state.tabs.filter((tab) => tab.id !== (action.id as number)),
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
          if (tab.id === (action.id as number)) {
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
