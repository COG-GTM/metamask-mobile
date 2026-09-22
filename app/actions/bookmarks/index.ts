export interface Bookmark {
  name?: string;
  url?: string;
  category?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
