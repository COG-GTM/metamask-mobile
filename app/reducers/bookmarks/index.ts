import { ADD_BOOKMARK, REMOVE_BOOKMARK, Bookmark, BookmarkAction } from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

export const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: BookmarkAction,
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
