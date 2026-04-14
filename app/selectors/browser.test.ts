import { selectBrowserHistoryWithType, selectBrowserBookmarksWithType } from './browser';

jest.mock('../components/UI/UrlAutocomplete', () => ({
  UrlAutocompleteCategory: { Recents: 'recents', Favorites: 'favorites' },
}));

describe('Browser Selectors', () => {
  describe('selectBrowserHistoryWithType', () => {
    it('should return history items with Recents category in reverse order', () => {
      const state = {
        browser: {
          history: [
            { url: 'https://a.com', name: 'A' },
            { url: 'https://b.com', name: 'B' },
          ],
        },
      } as any;
      const result = selectBrowserHistoryWithType(state);

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://b.com');
      expect(result[0].category).toBe('recents');
      expect(result[1].url).toBe('https://a.com');
    });
  });

  describe('selectBrowserBookmarksWithType', () => {
    it('should return bookmarks with Favorites category', () => {
      const state = {
        bookmarks: [{ url: 'https://c.com', name: 'C' }],
        browser: { history: [] },
      } as any;
      const result = selectBrowserBookmarksWithType(state);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('favorites');
    });
  });
});
