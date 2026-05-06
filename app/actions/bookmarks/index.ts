import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface Bookmark {
  url?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction
  extends ReduxAction<ActionType.ADD_BOOKMARK> {
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction
  extends ReduxAction<ActionType.REMOVE_BOOKMARK> {
  bookmark: Bookmark;
}

export type Action = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: ActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}
