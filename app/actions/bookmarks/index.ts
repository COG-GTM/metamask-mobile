interface Bookmark {
  url: string;
  name?: string;
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
