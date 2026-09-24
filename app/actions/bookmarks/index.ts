export const ADD_BOOKMARK = 'ADD_BOOKMARK';
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK';

export interface Bookmark {
  url: string;
  name: string;
}

/**
 * Bookmark-shaped payload, identified by its url when present.
 */
export type BookmarkLike = Partial<Bookmark>;

export interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: BookmarkLike;
}

export type BookmarksActionTypes = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark<T extends BookmarkLike>(
  bookmark: T,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
