/* eslint-disable @typescript-eslint/default-param-last */
import type { Action } from '../../actions/bookmarks';

interface Bookmark {
  url: string;
  [key: string]: unknown;
}

export type State = Bookmark[];

export const initialState: State = [];

const bookmarksReducer = (
  state: State = initialState,
  action: Action,
): State => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark as Bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter(
        (item) => item.url !== (action.bookmark as Bookmark).url,
      );
    default:
      return state;
  }
};
export default bookmarksReducer;
