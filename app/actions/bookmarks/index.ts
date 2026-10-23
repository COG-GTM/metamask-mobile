export enum ActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface Bookmark {
  url: string;
  name?: string;
  [key: string]: unknown;
}

export interface BookmarkReference {
  url?: string;
  [key: string]: unknown;
}

export interface AddBookmarkAction {
  type: ActionType.ADD_BOOKMARK;
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: ActionType.REMOVE_BOOKMARK;
  bookmark: BookmarkReference;
}

export type Action = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: ActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(
  bookmark: BookmarkReference,
): RemoveBookmarkAction {
  return {
    type: ActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}
