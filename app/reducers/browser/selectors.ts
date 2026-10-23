import { RootState } from '..';
import { BrowserHistoryEntry } from '.';

export const selectBrowserHistory = (state: RootState): BrowserHistoryEntry[] =>
  state.browser.history;

/**
 * Gets the selected search engine from the Redux state
 * @param state - Redux state
 * @returns - Selected search engine
 */
export const selectSearchEngine = (state: RootState) =>
  state.settings.searchEngine;
