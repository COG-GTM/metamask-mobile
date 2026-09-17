import { RootState } from '..';

/**
 * Gets the selected search engine from the Redux state
 * @param state - Redux state
 * @returns - Selected search engine
 */
export const selectSearchEngine = (state: RootState) =>
  state.settings.searchEngine;
