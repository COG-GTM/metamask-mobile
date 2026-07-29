interface Bookmark {
  url: string;
  name: string;
}

/**
 * Bookmarks are removed from contexts that only know part of the entry, such
 * as the browser autocomplete results, so every field is optional here.
 */
type RemovableBookmark = Partial<Bookmark> & Record<string, unknown>;

export function addBookmark(bookmark: Bookmark) {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: RemovableBookmark) {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
