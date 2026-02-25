import { Bookmark, BookmarkAction } from '../../reducers/bookmarks';

export function addBookmark(bookmark: Bookmark): BookmarkAction {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: { url: string; [key: string]: unknown }): BookmarkAction {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
