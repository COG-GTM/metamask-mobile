export const ADD_BOOKMARK = 'ADD_BOOKMARK';
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK';

export interface Bookmark {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: Bookmark;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
