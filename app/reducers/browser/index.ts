import { BrowserActionTypes } from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';
import { BrowserState, BrowserTab } from './types';

interface BrowserAction {
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
}

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
              metricsEnabled: action.metricsEnabled ?? false,
              marketingEnabled: action.marketingEnabled ?? false,
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
        activeTab: action.id ?? null,
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
