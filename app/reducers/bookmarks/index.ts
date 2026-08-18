export interface Bookmark {
  url: string;
  name?: string;
  category?: string;
}

interface BookmarksAction {
  type: string;
  bookmark?: Bookmark;
}

export type BookmarksState = Bookmark[];

/* eslint-disable @typescript-eslint/default-param-last */
const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarksAction,
): BookmarksState => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark as Bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter(
        (item) => item.url !== (action.bookmark as Bookmark).url,
      );
    default:
      return state;
  }
};
export default bookmarksReducer;
