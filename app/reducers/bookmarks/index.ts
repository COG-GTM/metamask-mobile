/* eslint-disable @typescript-eslint/default-param-last */

export interface Bookmark {
  url: string;
  name: string;
}

// TODO: import from actions when migrated
type AddBookmarkAction = {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
};

type RemoveBookmarkAction = {
  type: 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
};

type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;

export type BookmarksState = Bookmark[];

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarkAction,
): BookmarksState => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
