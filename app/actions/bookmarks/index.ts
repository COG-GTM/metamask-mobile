export const ADD_BOOKMARK = 'ADD_BOOKMARK';
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK';

export interface Bookmark {
  url?: string;
  name?: string;
}

/**
 * Callers build bookmarks from several sources (browser tabs, autocomplete
 * results), so extra source specific fields are accepted.
 */
export type BookmarkInput = Bookmark | Record<string, unknown>;

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: BookmarkInput;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: BookmarkInput;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: BookmarkInput): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: BookmarkInput): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
