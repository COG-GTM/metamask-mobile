export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  name: string;
  url: string;
}

/**
 * Payload accepted by {@link removeBookmark}. Bookmarks are matched by `url` in
 * the reducer, but callers pass through richer objects (e.g. autocomplete
 * search results), so extra properties are preserved on the dispatched action.
 */
export interface RemoveBookmarkPayload {
  url?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: RemoveBookmarkPayload;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(
  bookmark: RemoveBookmarkPayload,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
