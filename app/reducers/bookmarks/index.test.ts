import bookmarksReducer from './index';

describe('bookmarksReducer', () => {
  it('returns initial state', () => {
    expect(bookmarksReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual(
      [],
    );
  });

  it('adds a bookmark', () => {
    const state = bookmarksReducer(undefined, {
      type: 'ADD_BOOKMARK',
      bookmark: { url: 'https://example.com', name: 'Example' },
    });
    expect(state).toEqual([{ url: 'https://example.com', name: 'Example' }]);
  });

  it('removes a bookmark by url', () => {
    const firstState = bookmarksReducer(undefined, {
      type: 'ADD_BOOKMARK',
      bookmark: { url: 'https://example.com', name: 'Example' },
    });
    const secondState = bookmarksReducer(firstState, {
      type: 'REMOVE_BOOKMARK',
      bookmark: { url: 'https://example.com', name: 'Example' },
    });
    expect(secondState).toEqual([]);
  });
});
