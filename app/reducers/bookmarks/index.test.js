import bookmarksReducer from './';

describe('bookmarksReducer', () => {
  it('should return the initial state as empty array', () => {
    expect(bookmarksReducer(undefined, { type: 'UNKNOWN' })).toEqual([]);
  });

  it('should handle ADD_BOOKMARK', () => {
    const bookmark = { url: 'https://example.com', name: 'Example' };
    const result = bookmarksReducer([], {
      type: 'ADD_BOOKMARK',
      bookmark,
    });
    expect(result).toEqual([bookmark]);
  });

  it('should append bookmark to existing list', () => {
    const existing = [{ url: 'https://first.com', name: 'First' }];
    const newBookmark = { url: 'https://second.com', name: 'Second' };
    const result = bookmarksReducer(existing, {
      type: 'ADD_BOOKMARK',
      bookmark: newBookmark,
    });
    expect(result).toEqual([...existing, newBookmark]);
    expect(result).toHaveLength(2);
  });

  it('should handle REMOVE_BOOKMARK', () => {
    const state = [
      { url: 'https://first.com', name: 'First' },
      { url: 'https://second.com', name: 'Second' },
    ];
    const result = bookmarksReducer(state, {
      type: 'REMOVE_BOOKMARK',
      bookmark: { url: 'https://first.com' },
    });
    expect(result).toEqual([{ url: 'https://second.com', name: 'Second' }]);
  });

  it('should return unchanged state when removing non-existent bookmark', () => {
    const state = [{ url: 'https://first.com', name: 'First' }];
    const result = bookmarksReducer(state, {
      type: 'REMOVE_BOOKMARK',
      bookmark: { url: 'https://nonexistent.com' },
    });
    expect(result).toEqual(state);
  });

  it('should return state unchanged for unknown action', () => {
    const state = [{ url: 'https://example.com', name: 'Example' }];
    expect(bookmarksReducer(state, { type: 'UNKNOWN_ACTION' })).toBe(state);
  });
});
