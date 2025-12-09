import {
  type BrowserAction,
  BrowserActionType,
} from '../../actions/browser/types';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';
import { type BrowserState } from './types';

export * from './types';

/**
 * Initial browser state
 */
export const initialBrowserState: BrowserState = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  visitedDappsByHostname: {},
};

/**
 * Browser reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const browserReducer = (
  state: BrowserState = initialBrowserState,
  action: BrowserAction,
): BrowserState => {
  switch (action.type) {
    case BrowserActionType.ADD_TO_VIEWED_DAPP: {
      const { hostname } = action;
      return {
        ...state,
        visitedDappsByHostname: {
          ...state.visitedDappsByHostname,
          [hostname]: true,
        },
      };
    }
    case BrowserActionType.ADD_TO_BROWSER_HISTORY: {
      const { url, name } = action;
      return {
        ...state,
        history: [...state.history, { url, name }].slice(-50),
      };
    }
    case BrowserActionType.ADD_TO_BROWSER_WHITELIST:
      return {
        ...state,
        whitelist: [...state.whitelist, action.url],
      };
    case BrowserActionType.CLEAR_BROWSER_HISTORY:
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
    case BrowserActionType.CLOSE_ALL_TABS:
      return {
        ...state,
        tabs: [],
      };
    case BrowserActionType.CREATE_NEW_TAB:
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
    case BrowserActionType.CLOSE_TAB:
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.id),
      };
    case BrowserActionType.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.id,
      };
    case BrowserActionType.UPDATE_TAB:
      return {
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      };
    case BrowserActionType.STORE_FAVICON_URL:
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
