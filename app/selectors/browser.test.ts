import {
  selectBrowserHistoryWithType,
  selectBrowserBookmarksWithType,
} from './browser';
import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import { RootState } from '../reducers';

describe('browser selectors', () => {
  describe('selectBrowserHistoryWithType', () => {
    it('should return history items with Recents category in reverse order', () => {
      const state = {
        browser: {
          history: [
            { url: 'https://first.com', name: 'First' },
            { url: 'https://second.com', name: 'Second' },
          ],
        },
      } as unknown as RootState;

      const result = selectBrowserHistoryWithType(state);
      expect(result).toEqual([
        {
          url: 'https://second.com',
          name: 'Second',
          category: UrlAutocompleteCategory.Recents,
        },
        {
          url: 'https://first.com',
          name: 'First',
          category: UrlAutocompleteCategory.Recents,
        },
      ]);
    });

    it('should return empty array for empty history', () => {
      const state = {
        browser: { history: [] },
      } as unknown as RootState;
      expect(selectBrowserHistoryWithType(state)).toEqual([]);
    });
  });

  describe('selectBrowserBookmarksWithType', () => {
    it('should return bookmark items with Favorites category', () => {
      const state = {
        bookmarks: [
          { url: 'https://example.com', name: 'Example' },
          { url: 'https://metamask.io', name: 'MetaMask' },
        ],
      } as unknown as RootState;

      const result = selectBrowserBookmarksWithType(state);
      expect(result).toEqual([
        {
          url: 'https://example.com',
          name: 'Example',
          category: UrlAutocompleteCategory.Favorites,
        },
        {
          url: 'https://metamask.io',
          name: 'MetaMask',
          category: UrlAutocompleteCategory.Favorites,
        },
      ]);
    });

    it('should return empty array for empty bookmarks', () => {
      const state = {
        bookmarks: [],
      } as unknown as RootState;
      expect(selectBrowserBookmarksWithType(state)).toEqual([]);
    });
  });
});
