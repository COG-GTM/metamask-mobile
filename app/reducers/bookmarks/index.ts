export interface Bookmark {
  url: string;
  name?: string;
}

export type BookmarksState = Bookmark[];

interface BookmarkAction {
  type: string;
  bookmark?: Bookmark;
}

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarkAction,
): BookmarksState => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      if (!action.bookmark) {
        return state;
      }
      return [...state, action.bookmark];
    case 'REMOVE_BOOKMARK':
      if (!action.bookmark) {
        return state;
      }
      return state.filter((item) => item.url !== action.bookmark?.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
