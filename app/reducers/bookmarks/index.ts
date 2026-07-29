export interface Bookmark {
  url: string;
  name: string;
}

interface BookmarksAction {
  type: 'ADD_BOOKMARK' | 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

const bookmarksReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
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
