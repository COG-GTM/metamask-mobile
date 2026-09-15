export interface Bookmark {
  name: string;
  url: string;
}

export interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: Pick<Bookmark, 'url'>;
}

export type BookmarksAction = AddBookmarkAction | RemoveBookmarkAction;

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(
  bookmark: Pick<Bookmark, 'url'>,
): RemoveBookmarkAction {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
