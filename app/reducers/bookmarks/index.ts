import { Reducer } from 'redux';

/**
 * Represents a bookmark entry
 */
export interface Bookmark {
  url: string;
  name: string;
}

/**
 * State shape for the bookmarks reducer
 */
export type BookmarksState = Bookmark[];

/**
 * Action types for bookmarks
 */
export const ACTIONS = {
  ADD_BOOKMARK: 'ADD_BOOKMARK',
  REMOVE_BOOKMARK: 'REMOVE_BOOKMARK',
} as const;

interface AddBookmarkAction {
  type: typeof ACTIONS.ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: typeof ACTIONS.REMOVE_BOOKMARK;
  bookmark: Bookmark;
}

type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export const initialState: BookmarksState = [];

const bookmarksReducer: Reducer<
  BookmarksState,
  BookmarksAction | { type: string }
> = (state = initialState, action): BookmarksState => {
  switch (action.type) {
    case ACTIONS.ADD_BOOKMARK:
      return [...state, (action as AddBookmarkAction).bookmark];
    case ACTIONS.REMOVE_BOOKMARK:
      return state.filter(
        (item) => item.url !== (action as RemoveBookmarkAction).bookmark.url,
      );
    default:
      return state;
  }
};

export default bookmarksReducer;
