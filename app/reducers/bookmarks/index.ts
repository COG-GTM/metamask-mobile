interface Bookmark {
  url: string;
  name: string;
}

interface BookmarksAction {
  type: string | null;
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
