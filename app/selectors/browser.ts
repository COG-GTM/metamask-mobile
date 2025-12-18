import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import { RootState } from '../reducers';
import { BookmarksState } from '../reducers/bookmarks';
import { BrowserHistoryItem } from '../reducers/browser';
import { createDeepEqualSelector } from './util';

export const selectBrowserHistoryWithType = createDeepEqualSelector(
    (state: RootState) => state.browser.history,
    (history: BrowserHistoryItem[]) => history.map(item => ({...item, category: UrlAutocompleteCategory.Recents} as const)).reverse()
);

export const selectBrowserBookmarksWithType = createDeepEqualSelector(
    (state: RootState) => state.bookmarks,
    (bookmarks: BookmarksState) => bookmarks.map(item => ({...item, category: UrlAutocompleteCategory.Favorites} as const))
);
