import { Action } from 'redux';

export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

interface AddBookmarkAction extends Action<'ADD_BOOKMARK'> {
  bookmark: Bookmark;
}

interface RemoveBookmarkAction extends Action<'REMOVE_BOOKMARK'> {
  bookmark: Bookmark;
}

type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarksAction,
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
