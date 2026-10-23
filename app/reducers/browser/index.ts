import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  AddToHistoryAction,
  AddToViewedDappAction,
  AddToWhitelistAction,
  BrowserActionTypes,
  BrowserTabData,
  ClearHistoryAction,
  CloseTabAction,
  CreateNewTabAction,
  SetActiveTabAction,
  StoreFaviconAction,
  UpdateTabAction,
} from '../../actions/browser';
import AppConstants from '../../core/AppConstants';
import { appendURLParams } from '../../util/browser';

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab extends BrowserTabData {
  url: string;
  id: number;
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
  visitedDappsByHostname: Record<string, boolean>;
}

export const initialState: BrowserState = {
  history: [],
  whitelist: [],
  tabs: [],
  favicons: [],
  activeTab: null,
  visitedDappsByHostname: {},
};

const browserSlice = createSlice({
  name: 'browser',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        BrowserActionTypes.ADD_TO_VIEWED_DAPP,
        (state, action: AddToViewedDappAction) => {
          const { hostname } = action;
          return {
            ...state,
            visitedDappsByHostname: {
              ...state.visitedDappsByHostname,
              [hostname]: true,
            },
          };
        },
      )
      .addCase(
        ActionType.ADD_TO_BROWSER_HISTORY,
        (state, action: AddToHistoryAction) => {
          const { url, name } = action;

          return {
            ...state,
            history: [...state.history, { url, name }].slice(-50),
          };
        },
      )
      .addCase(
        ActionType.ADD_TO_BROWSER_WHITELIST,
        (state, action: AddToWhitelistAction) => ({
          ...state,
          whitelist: [...state.whitelist, action.url],
        }),
      )
      .addCase(
        ActionType.CLEAR_BROWSER_HISTORY,
        (state, action: ClearHistoryAction) => ({
          ...state,
          history: [],
          favicons: [],
          tabs: [
            {
              url: appendURLParams(AppConstants.HOMEPAGE_URL, {
                metricsEnabled: action.metricsEnabled,
                marketingEnabled: action.marketingEnabled,
              } as Record<string, boolean>).href,
              id: action.id,
            },
          ],
          activeTab: action.id,
        }),
      )
      .addCase(ActionType.CLOSE_ALL_TABS, (state) => ({
        ...state,
        tabs: [],
      }))
      .addCase(
        ActionType.CREATE_NEW_TAB,
        (state, action: CreateNewTabAction) => ({
          ...state,
          tabs: [
            ...state.tabs,
            {
              url: action.url,
              ...(action.linkType && { linkType: action.linkType }),
              id: action.id,
            },
          ],
        }),
      )
      .addCase(ActionType.CLOSE_TAB, (state, action: CloseTabAction) => ({
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.id),
      }))
      .addCase(
        ActionType.SET_ACTIVE_TAB,
        (state, action: SetActiveTabAction) => ({
          ...state,
          activeTab: action.id,
        }),
      )
      .addCase(ActionType.UPDATE_TAB, (state, action: UpdateTabAction) => ({
        ...state,
        tabs: state.tabs.map((tab) => {
          if (tab.id === action.id) {
            return { ...tab, ...action.data };
          }
          return { ...tab };
        }),
      }))
      .addCase(
        ActionType.STORE_FAVICON_URL,
        (state, action: StoreFaviconAction) => ({
          ...state,
          favicons: [
            { origin: action.origin, url: action.url },
            ...state.favicons,
          ].slice(0, AppConstants.FAVICON_CACHE_MAX_SIZE),
        }),
      );
  },
});

export default browserSlice.reducer;
