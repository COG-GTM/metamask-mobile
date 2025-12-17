/**
 * Bookmark entry
 */
export interface Bookmark {
  url: string;
  name?: string;
}

/**
 * Bookmarks reducer state (array of bookmarks)
 */
export type BookmarksState = Bookmark[];
