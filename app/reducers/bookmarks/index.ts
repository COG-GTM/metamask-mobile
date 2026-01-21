import { Action } from 'redux';

export interface Bookmark {
  url: string;
  name: string;
}

export type BookmarksState = Bookmark[];

interface AddBookmarkAction extends Action<'ADD_BOOKMARK'> {
  bookmark: Bookmark;
}

interface RemoveBookmarkAction extends Action<'REMOVE_BOOKMARK'> {
  bookmark: Bookmark;
}

type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction | Action<string>;

const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: BookmarksAction,
): BookmarksState => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, (action as AddBookmarkAction).bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter(
        (item) => item.url !== (action as RemoveBookmarkAction).bookmark.url,
      );
    default:
      return state;
  }
};
export default bookmarksReducer;
