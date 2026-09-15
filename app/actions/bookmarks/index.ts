import { type Action } from 'redux';

export enum BookmarksActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface Bookmark {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

export type AddBookmarkAction = Action<BookmarksActionType.ADD_BOOKMARK> & {
  bookmark: Bookmark;
};

export type RemoveBookmarkAction =
  Action<BookmarksActionType.REMOVE_BOOKMARK> & {
    bookmark: Bookmark;
  };

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: BookmarksActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: BookmarksActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}
