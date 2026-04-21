/* eslint-disable @typescript-eslint/default-param-last */
import type { Bookmark, BookmarksAction } from '../../actions/bookmarks';
import { ADD_BOOKMARK, REMOVE_BOOKMARK } from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarksAction,
): BookmarksState => {
  switch (action.type) {
    case ADD_BOOKMARK:
      return [...state, action.bookmark];
    case REMOVE_BOOKMARK:
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
