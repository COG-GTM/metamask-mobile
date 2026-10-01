import bookmarksReducer, { initialState } from '.';
import { addBookmark, removeBookmark } from '../../actions/bookmarks';

describe('bookmarksReducer', () => {
  it('returns the initial state by default', () => {
    expect(
      bookmarksReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual(initialState);
  });

  it('handles ADD_BOOKMARK', () => {
    const bookmark = { name: 'MetaMask', url: 'https://metamask.io' };
    expect(bookmarksReducer(initialState, addBookmark(bookmark))).toEqual([
      bookmark,
    ]);
  });

  it('handles REMOVE_BOOKMARK', () => {
    const bookmark = { name: 'MetaMask', url: 'https://metamask.io' };
    const other = { name: 'Other', url: 'https://other.io' };
    expect(
      bookmarksReducer([bookmark, other], removeBookmark({ url: bookmark.url })),
    ).toEqual([other]);
  });
});
