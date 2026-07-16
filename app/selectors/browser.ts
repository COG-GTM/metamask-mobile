import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import { RootState } from '../reducers';
import { BookmarksState } from '../reducers/bookmarks';
import { createDeepEqualSelector } from './util';

interface SiteItem {
    url: string;
    name: string;
}

export const selectBrowserHistoryWithType = createDeepEqualSelector(
    (state: RootState) => state.browser.history,
    (history: SiteItem[]) => history.map(item => ({...item, category: UrlAutocompleteCategory.Recents} as const)).reverse()
);

export const selectBrowserBookmarksWithType = createDeepEqualSelector(
    (state: RootState) => state.bookmarks,
    (bookmarks: BookmarksState) => bookmarks.map(item => ({...item, name: item.name ?? '', category: UrlAutocompleteCategory.Favorites} as const))
);
