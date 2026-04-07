import { BookmarkAction } from '../../actions/bookmarks';

interface Bookmark {
  url: string;
  name: string;
}

const bookmarksReducer = (state: Bookmark[] = [], action: BookmarkAction): Bookmark[] => {
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
