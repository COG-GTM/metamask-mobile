import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import { RootState } from '../reducers';
import { createDeepEqualSelector } from './util';
import type { Bookmark } from '../actions/bookmarks';

type SiteItem = Required<Pick<Bookmark, 'url' | 'name'>>;

export const selectBrowserHistoryWithType = createDeepEqualSelector(
    (state: RootState) => state.browser.history,
    (history: SiteItem[]) => history.map(item => ({...item, category: UrlAutocompleteCategory.Recents} as const)).reverse()
);

export const selectBrowserBookmarksWithType = createDeepEqualSelector(
    (state: RootState) => state.bookmarks,
    (bookmarks: Bookmark[]) => bookmarks.map(item => ({...item, category: UrlAutocompleteCategory.Favorites} as const))
);
