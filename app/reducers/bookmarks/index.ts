/**
 * Represents a bookmark item
 */
export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * State shape for the bookmarks reducer (array of bookmarks)
 */
export type BookmarksState = Bookmark[];

/**
 * Action types for bookmarks reducer
 */
interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
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
