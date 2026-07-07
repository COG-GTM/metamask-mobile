export const ADD_BOOKMARK = 'ADD_BOOKMARK';
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK';

export interface Bookmark {
  url: string;
  name: string;
}

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: { url: string };
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark<T extends { url: string }>(
  bookmark: T,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
