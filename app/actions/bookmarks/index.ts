// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bookmark = Record<string, any>;

export function addBookmark(bookmark: Bookmark) {
  return {
    type: 'ADD_BOOKMARK' as const,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark) {
  return {
    type: 'REMOVE_BOOKMARK' as const,
    bookmark,
  };
}
