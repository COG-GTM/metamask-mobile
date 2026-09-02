export interface Bookmark {
  url: string;
  name?: string;
}

interface BookmarksAction {
  type: string;
  bookmark: Bookmark;
}

/* eslint-disable @typescript-eslint/default-param-last */
const bookmarksReducer = (
  state: Bookmark[] = [],
  action: BookmarksAction,
): Bookmark[] => {
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
