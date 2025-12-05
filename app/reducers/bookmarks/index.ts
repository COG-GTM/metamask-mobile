import {
  Bookmark,
  BookmarkAction,
  BookmarkActionType,
} from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: BookmarkAction = { type: BookmarkActionType.ADD_BOOKMARK, bookmark: { name: '', url: '' } },
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
