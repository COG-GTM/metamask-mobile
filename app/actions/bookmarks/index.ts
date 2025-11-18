import {
  type AddBookmarkAction,
  type RemoveBookmarkAction,
  type Bookmark,
  BookmarkActionType,
} from './types';

export * from './types';

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
