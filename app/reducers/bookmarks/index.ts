/* eslint-disable @typescript-eslint/default-param-last */

const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name: string;
}

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: Bookmark;
}

type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export type BookmarksState = Bookmark[];

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarkAction,
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
