import {
  BookmarkActionTypes,
  BookmarkAction,
  Bookmark,
} from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

export const bookmarksInitialState: BookmarksState = [];

/* eslint-disable @typescript-eslint/default-param-last */
const bookmarksReducer = (
  state: BookmarksState = bookmarksInitialState,
  action: BookmarkAction,
): BookmarksState => {
  switch (action.type) {
    case BookmarkActionTypes.ADD_BOOKMARK:
      return [...state, action.bookmark];
    case BookmarkActionTypes.REMOVE_BOOKMARK:
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};

export default bookmarksReducer;
