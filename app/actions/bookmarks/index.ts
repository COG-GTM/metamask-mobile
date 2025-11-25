// Type definitions
interface Bookmark {
  url: string;
  name: string;
}

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
