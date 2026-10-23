import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  AddBookmarkAction,
  Bookmark,
  RemoveBookmarkAction,
} from '../../actions/bookmarks';

export type BookmarksState = Bookmark[];

export const initialState: BookmarksState = [];

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ActionType.ADD_BOOKMARK, (state, action: AddBookmarkAction) => [
        ...state,
        action.bookmark,
      ])
      .addCase(
        ActionType.REMOVE_BOOKMARK,
        (state, action: RemoveBookmarkAction) =>
          state.filter((item) => item.url !== action.bookmark.url),
      );
  },
});

export default bookmarksSlice.reducer;
