import { addBookmark, removeBookmark } from '.';

describe('Bookmark Actions', () => {
  describe('addBookmark', () => {
    it('should return ADD_BOOKMARK action with bookmark', () => {
      const bookmark = { url: 'https://example.com', name: 'Example' };

      expect(addBookmark(bookmark)).toStrictEqual({
        type: 'ADD_BOOKMARK',
        bookmark,
      });
    });
  });

  describe('removeBookmark', () => {
    it('should return REMOVE_BOOKMARK action with bookmark', () => {
      const bookmark = { url: 'https://example.com', name: 'Example' };

      expect(removeBookmark(bookmark)).toStrictEqual({
        type: 'REMOVE_BOOKMARK',
        bookmark,
      });
    });
  });
});
