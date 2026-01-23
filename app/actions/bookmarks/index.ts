export const BookmarkActionTypes = {
  ADD_BOOKMARK: 'ADD_BOOKMARK',
  REMOVE_BOOKMARK: 'REMOVE_BOOKMARK',
} as const;

export interface Bookmark {
  url: string;
  name: string;
}

export interface AddBookmarkAction {
  type: typeof BookmarkActionTypes.ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: typeof BookmarkActionTypes.REMOVE_BOOKMARK;
  bookmark: Bookmark;
}

export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: BookmarkActionTypes.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: BookmarkActionTypes.REMOVE_BOOKMARK,
    bookmark,
  };
}
