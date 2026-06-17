export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  url?: string;
  name?: string;
  category?: string;
}

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
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
