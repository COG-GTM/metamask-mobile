export interface Bookmark {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

export function addBookmark(bookmark: Bookmark) {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark) {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
