import { Bookmark, BookmarkAction } from '../../actions/bookmarks';

const bookmarksReducer = (
  state: Bookmark[] = [],
  action: BookmarkAction,
): Bookmark[] => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
