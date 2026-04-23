export const ADD_BOOKMARK = 'ADD_BOOKMARK' as const;
export const REMOVE_BOOKMARK = 'REMOVE_BOOKMARK' as const;

export interface Bookmark {
  name: string;
  url: string;
}

interface AddBookmarkAction {
  type: typeof ADD_BOOKMARK;
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: typeof REMOVE_BOOKMARK;
  bookmark: Pick<Bookmark, 'url'>;
}

export type BookmarkActionTypes = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(
  bookmark: Pick<Bookmark, 'url'>,
): RemoveBookmarkAction {
  return {
    type: REMOVE_BOOKMARK,
    bookmark,
  };
}
