import { AnyAction } from 'redux';

export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

const bookmarksReducer = (
  state: BookmarksState = [],
  action: AnyAction,
): BookmarksState => {
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
