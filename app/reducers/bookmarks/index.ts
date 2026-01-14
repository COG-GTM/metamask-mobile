/* eslint-disable @typescript-eslint/default-param-last */
import {
  Bookmark,
  BookmarkAction,
  BookmarkActionType,
} from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

export type { Bookmark } from '../../actions/bookmarks';

export const bookmarksInitialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = bookmarksInitialState,
  action: BookmarkAction,
): BookmarksState => {
  switch (action.type) {
    case BookmarkActionType.ADD_BOOKMARK:
      return [...state, action.bookmark];
    case BookmarkActionType.REMOVE_BOOKMARK:
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};

export default bookmarksReducer;
