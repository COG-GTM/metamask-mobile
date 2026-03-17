import type { Action as ReduxAction } from 'redux';

export enum BookmarkActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface Bookmark {
  url: string;
  name: string;
}

export interface AddBookmarkAction
  extends ReduxAction<BookmarkActionType.ADD_BOOKMARK> {
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction
  extends ReduxAction<BookmarkActionType.REMOVE_BOOKMARK> {
  bookmark: Bookmark;
}

export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: BookmarkActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: BookmarkActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}
