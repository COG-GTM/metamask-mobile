export interface Bookmark {
  name: string;
  url: string;
}

export interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

export interface BookmarkReference {
  url?: string;
  [key: string]: unknown;
}

export interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: BookmarkReference;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(
  bookmark: BookmarkReference,
): RemoveBookmarkAction {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
