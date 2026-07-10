import bookmarksReducer from './index';
import type { BookmarksAction } from '../../actions/bookmarks';

const emptyAction = { type: null } as unknown as BookmarksAction;

describe('bookmarksReducer', () => {
  it('should return initial state', () => {
    expect(bookmarksReducer(undefined, emptyAction)).toEqual([]);
  });
});
