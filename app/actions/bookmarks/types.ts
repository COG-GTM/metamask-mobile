import { type Action } from 'redux';

export interface Bookmark {
  url: string;
  name?: string;
  [key: string]: unknown;
}

export enum BookmarkActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export type AddBookmarkAction = Action<BookmarkActionType.ADD_BOOKMARK> & {
  bookmark: Bookmark;
};

export type RemoveBookmarkAction = Action<BookmarkActionType.REMOVE_BOOKMARK> & {
  bookmark: Bookmark;
};

export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;
