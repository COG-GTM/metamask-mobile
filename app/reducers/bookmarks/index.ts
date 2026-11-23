export interface Bookmark {
  name?: string;
  url: string;
}

export type BookmarksState = Bookmark[];

export interface BookmarksAction {
  type: string;
  bookmark?: Bookmark;
}

const bookmarksReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: BookmarksState = [],
  action: BookmarksAction,
): BookmarksState => {
  switch (action.type) {
    case 'ADD_BOOKMARK':
      return [...state, action.bookmark as Bookmark];
    case 'REMOVE_BOOKMARK':
      return state.filter((item) => item.url !== action.bookmark?.url);
    default:
      return state;
  }
};
export default bookmarksReducer;
