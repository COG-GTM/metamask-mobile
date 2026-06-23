export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url: string;
  name: string;
}

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

/**
 * Loose bookmark shape accepted when removing, since callers pass through
 * heterogeneous search results that are only matched by `url`.
 */
export interface RemovableBookmark {
  url?: string;
  name?: string;
  [key: string]: unknown;
}

interface RemoveBookmarkAction {
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

export function removeBookmark(
  bookmark: RemovableBookmark,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
