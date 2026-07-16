export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * Loosely-typed bookmark accepted when removing entries. Removal filters by
 * `url`, so callers may pass richer result objects that lack some fields.
 */
export type BookmarkLike = Bookmark | Record<string, unknown>;

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: BookmarkLike;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: BookmarkLike): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
