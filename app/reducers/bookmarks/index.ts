/* eslint-disable @typescript-eslint/default-param-last */

const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name: string;
}

export type BookmarksState = Bookmark[];

export type BookmarksAction =
  | { type: typeof ADD_BOOKMARK; bookmark: Bookmark }
  | { type: typeof REMOVE_BOOKMARK; bookmark: Bookmark };

const initialState: BookmarksState = [];

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
