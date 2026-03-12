export function addBookmark(bookmark: { url: string; name: string }) {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: { url: string; name: string }) {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
