import { Bookmark, BookmarkActionTypes } from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

/* eslint-disable @typescript-eslint/default-param-last */
const bookmarksReducer = (state: BookmarksState = [], action: BookmarkActionTypes): BookmarksState => {
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
