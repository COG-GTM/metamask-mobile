import reducer, { initialState } from './index';
import { addBookmark, type BookmarksAction } from '../../actions/bookmarks';

describe('bookmarksReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as BookmarksAction),
    ).toEqual(initialState);
  });

  it('adds a bookmark', () => {
    const bookmark = { name: 'MetaMask', url: 'https://metamask.io' };
    expect(reducer(undefined, addBookmark(bookmark))).toEqual([bookmark]);
  });
});
