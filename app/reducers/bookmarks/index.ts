import { Action } from 'redux';

export interface Bookmark {
  url: string;
  name: string;
}

interface AddBookmarkAction extends Action<'ADD_BOOKMARK'> {
  bookmark: Bookmark;
}

interface RemoveBookmarkAction extends Action<'REMOVE_BOOKMARK'> {
  bookmark: Bookmark;
}

type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export type BookmarksState = Bookmark[];

const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: BookmarkAction = { type: 'ADD_BOOKMARK', bookmark: { url: '', name: '' } },
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
