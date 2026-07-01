/* eslint-disable @typescript-eslint/default-param-last */
import { AnyAction } from 'redux';

export interface Bookmark {
  url: string;
  name: string;
}

export type BookmarksState = Bookmark[];

const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
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
