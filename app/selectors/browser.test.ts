import { selectBrowserHistoryWithType, selectBrowserBookmarksWithType } from './browser';

jest.mock('../components/UI/UrlAutocomplete', () => ({
  UrlAutocompleteCategory: {
    Recents: 'recents',
    Favorites: 'favorites',
  },
}));

const mockState = {
  browser: {
    history: [
      { url: 'https://example.com', name: 'Example' },
      { url: 'https://test.com', name: 'Test' },
    ],
  },
  bookmarks: [
    { url: 'https://bookmark1.com', name: 'Bookmark 1' },
    { url: 'https://bookmark2.com', name: 'Bookmark 2' },
  ],
} as any;

describe('browser selectors', () => {
  it('selectBrowserHistoryWithType returns history with category reversed', () => {
    const result = selectBrowserHistoryWithType(mockState);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ url: 'https://test.com', category: 'recents' }));
    expect(result[1]).toEqual(expect.objectContaining({ url: 'https://example.com', category: 'recents' }));
  });

  it('selectBrowserBookmarksWithType returns bookmarks with category', () => {
    const result = selectBrowserBookmarksWithType(mockState);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ url: 'https://bookmark1.com', category: 'favorites' }));
  });

  it('returns empty arrays for empty state', () => {
    const emptyState = { browser: { history: [] }, bookmarks: [] } as any;
    expect(selectBrowserHistoryWithType(emptyState)).toEqual([]);
    expect(selectBrowserBookmarksWithType(emptyState)).toEqual([]);
  });
});
