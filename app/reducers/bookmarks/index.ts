/* eslint-disable @typescript-eslint/default-param-last */
import type { AnyAction } from 'redux';

export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

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
