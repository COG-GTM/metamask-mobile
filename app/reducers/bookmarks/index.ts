import { BookmarkActionType, BookmarkAction, Bookmark } from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

const bookmarksReducer = (
  state: BookmarksState = [],
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
