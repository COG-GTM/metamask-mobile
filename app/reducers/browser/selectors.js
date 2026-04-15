

export const selectBrowserHistory = (state) => state.browser.history;

/**
 * Gets the selected search engine from the Redux state
 * @param state - Redux state
 * @returns - Selected search engine
 */
export const selectSearchEngine = (state) =>
state.settings.searchEngine;