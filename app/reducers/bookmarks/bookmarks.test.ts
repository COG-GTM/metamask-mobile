import bookmarksReducer from './index';
import { addBookmark, removeBookmark } from '../../actions/bookmarks';

describe('bookmarksReducer', () => {
  const bookmarkA = { url: 'https://a.com', name: 'A' };
  const bookmarkB = { url: 'https://b.com', name: 'B' };

  it('returns the initial state', () => {
    expect(bookmarksReducer(undefined, { type: 'UNKNOWN' })).toEqual([]);
  });

  it('adds bookmarks', () => {
    let state = bookmarksReducer(undefined, addBookmark(bookmarkA));
    state = bookmarksReducer(state, addBookmark(bookmarkB));
    expect(state).toEqual([bookmarkA, bookmarkB]);
  });

  it('removes bookmarks by url', () => {
    const state = bookmarksReducer(
      [bookmarkA, bookmarkB],
      removeBookmark({ url: 'https://a.com' }),
    );
    expect(state).toEqual([bookmarkB]);
  });

  it('creates actions', () => {
    expect(addBookmark(bookmarkA)).toEqual({
      type: 'ADD_BOOKMARK',
      bookmark: bookmarkA,
    });
    expect(removeBookmark(bookmarkA)).toEqual({
      type: 'REMOVE_BOOKMARK',
      bookmark: bookmarkA,
    });
  });
});
