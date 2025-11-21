import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import { RootState } from '../reducers';
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
    (bookmarks) => bookmarks.map(item => ({url: item.url, name: item.name || '', category: UrlAutocompleteCategory.Favorites} as const))
);
