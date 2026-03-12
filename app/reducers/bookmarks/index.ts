// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bookmark = Record<string, any>;

interface BookmarkAction {
  type: string;
  bookmark?: Bookmark;
}

const bookmarksReducer = (state: Bookmark[] = [], action: BookmarkAction): Bookmark[] => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark!];
    case 'REMOVE_BOOKMARK':
      return state.filter((item) => item.url !== action.bookmark!.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
