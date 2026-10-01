/* eslint-disable @typescript-eslint/default-param-last */
import {
  Bookmark,
  BookmarksAction,
  ADD_BOOKMARK,
  REMOVE_BOOKMARK,
} from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

export const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
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
