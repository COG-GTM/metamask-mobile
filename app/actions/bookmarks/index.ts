import { Action } from 'redux';

export interface Bookmark {
  name: string;
  url: string;
}

export type BookmarkToRemove = {
  url: string;
} & Record<string, unknown>;

export enum BookmarkActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface AddBookmarkAction extends Action<BookmarkActionType.ADD_BOOKMARK> {
  type: BookmarkActionType.ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction extends Action<BookmarkActionType.REMOVE_BOOKMARK> {
  type: BookmarkActionType.REMOVE_BOOKMARK;
  bookmark: BookmarkToRemove;
}

export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: BookmarkActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: BookmarkToRemove): RemoveBookmarkAction {
  return {
    type: BookmarkActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}
