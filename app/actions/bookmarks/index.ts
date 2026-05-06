import type { Action } from 'redux';

export interface Bookmark {
  url?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction extends Action<'ADD_BOOKMARK'> {
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction extends Action<'REMOVE_BOOKMARK'> {
  bookmark: Bookmark;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

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
