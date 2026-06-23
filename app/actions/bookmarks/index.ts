export const ADD_BOOKMARK = 'ADD_BOOKMARK';
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK';

interface Bookmark {
  url: string;
  name: string;
}

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkInput {
  url?: string;
  [key: string]: unknown;
}

interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: RemoveBookmarkInput;
}

export type BookmarksActionTypes = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(
  bookmark: RemoveBookmarkInput,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
