import bookmarksReducer from './';

describe('bookmarksReducer', () => {
  it('returns initial state as empty array', () => {
    const state = bookmarksReducer(undefined, { type: 'INIT' });
    expect(state).toEqual([]);
  });

  it('handles ADD_BOOKMARK', () => {
    const bookmark = { url: 'https://example.com', name: 'Example' };
    const state = bookmarksReducer([], {
      type: 'ADD_BOOKMARK',
      bookmark,
    });
    expect(state).toEqual([bookmark]);
  });

  it('handles multiple ADD_BOOKMARK', () => {
    const bookmark1 = { url: 'https://example.com', name: 'Example' };
    const bookmark2 = { url: 'https://metamask.io', name: 'MetaMask' };
    let state = bookmarksReducer([], { type: 'ADD_BOOKMARK', bookmark: bookmark1 });
    state = bookmarksReducer(state, { type: 'ADD_BOOKMARK', bookmark: bookmark2 });
    expect(state).toEqual([bookmark1, bookmark2]);
  });

  it('handles REMOVE_BOOKMARK', () => {
    const bookmark1 = { url: 'https://example.com', name: 'Example' };
    const bookmark2 = { url: 'https://metamask.io', name: 'MetaMask' };
    const stateWithBookmarks = [bookmark1, bookmark2];
    const state = bookmarksReducer(stateWithBookmarks, {
      type: 'REMOVE_BOOKMARK',
      bookmark: bookmark1,
    });
    expect(state).toEqual([bookmark2]);
  });

  it('handles REMOVE_BOOKMARK for non-existent bookmark', () => {
    const bookmark = { url: 'https://example.com', name: 'Example' };
    const state = bookmarksReducer([bookmark], {
      type: 'REMOVE_BOOKMARK',
      bookmark: { url: 'https://nonexistent.com' },
    });
    expect(state).toEqual([bookmark]);
  });

  it('returns current state for unknown action', () => {
    const bookmarks = [{ url: 'https://example.com', name: 'Example' }];
    const state = bookmarksReducer(bookmarks, { type: 'UNKNOWN' });
    expect(state).toEqual(bookmarks);
  });
});
