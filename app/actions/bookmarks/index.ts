export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name: string;
}

/**
 * Bookmark-like object accepted when removing a bookmark. Only `url` is used by
 * the reducer, but callers pass richer objects (e.g. autocomplete results).
 */
export interface RemovableBookmark {
  url?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: RemovableBookmark;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: RemovableBookmark): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
