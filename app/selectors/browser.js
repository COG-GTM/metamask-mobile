import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';

import { createDeepEqualSelector } from './util';






export const selectBrowserHistoryWithType = createDeepEqualSelector(
  (state) => state.browser.history,
  (history) => history.map((item) => ({ ...item, category: UrlAutocompleteCategory.Recents })).reverse()
);

export const selectBrowserBookmarksWithType = createDeepEqualSelector(
  (state) => state.bookmarks,
  (bookmarks) => bookmarks.map((item) => ({ ...item, category: UrlAutocompleteCategory.Favorites }))
);