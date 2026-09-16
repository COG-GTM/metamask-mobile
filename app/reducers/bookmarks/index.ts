/* eslint-disable @typescript-eslint/default-param-last */
export interface Bookmark {
  name: string;
  url: string;
}

export interface BookmarksAction {
  type: 'ADD_BOOKMARK' | 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

const bookmarksReducer = (state: Bookmark[] = [], action: BookmarksAction) => {
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
