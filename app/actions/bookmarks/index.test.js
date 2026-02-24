import { addBookmark, removeBookmark } from './';

describe('Bookmarks Actions', () => {
  describe('addBookmark', () => {
    it('returns ADD_BOOKMARK action', () => {
      const bookmark = { url: 'https://example.com', name: 'Example' };
      expect(addBookmark(bookmark)).toEqual({
        type: 'ADD_BOOKMARK',
        bookmark,
      });
    });
  });

  describe('removeBookmark', () => {
    it('returns REMOVE_BOOKMARK action', () => {
      const bookmark = { url: 'https://example.com', name: 'Example' };
      expect(removeBookmark(bookmark)).toEqual({
        type: 'REMOVE_BOOKMARK',
        bookmark,
      });
    });
  });
});
