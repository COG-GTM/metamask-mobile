import { AnyAction } from 'redux';

export interface Bookmark {
  url: string;
  name: string;
}

export type BookmarkAction =
  | { type: 'ADD_BOOKMARK'; bookmark: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; bookmark: Bookmark };

const bookmarksReducer = (
  state: Bookmark[] = [],
  action: AnyAction = { type: '' },
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
