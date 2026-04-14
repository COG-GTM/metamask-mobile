import bookmarksReducer from '.';

describe('Bookmarks Reducer', () => {
  it('should return initial state', () => {
    expect(bookmarksReducer(undefined, {})).toStrictEqual([]);
  });

  it('should handle ADD_BOOKMARK', () => {
    const bookmark = { url: 'https://example.com', name: 'Example' };
    const result = bookmarksReducer([], { type: 'ADD_BOOKMARK', bookmark });

    expect(result).toStrictEqual([bookmark]);
  });

  it('should handle REMOVE_BOOKMARK', () => {
    const state = [
      { url: 'https://example.com', name: 'Example' },
      { url: 'https://other.com', name: 'Other' },
    ];
    const result = bookmarksReducer(state, {
      type: 'REMOVE_BOOKMARK',
      bookmark: { url: 'https://example.com' },
    });

    expect(result).toStrictEqual([{ url: 'https://other.com', name: 'Other' }]);
  });

  it('should return state for unknown action', () => {
    const state = [{ url: 'https://example.com', name: 'Example' }];

    expect(bookmarksReducer(state, { type: 'UNKNOWN' })).toStrictEqual(state);
  });
});
