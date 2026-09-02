export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

interface BookmarkAction {
  type: typeof ADD_BOOKMARK | typeof REMOVE_BOOKMARK;
  bookmark: unknown;
}

export type Action = BookmarkAction;

export function addBookmark(bookmark: unknown): BookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: unknown): BookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
