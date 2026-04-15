/* eslint-disable @typescript-eslint/default-param-last */
import { createSlice } from '@reduxjs/toolkit';





const initialState = {
  dismissedBanners: []
};







const bannersSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {
    dismissBanner: (state, action) => {
      if (!state.dismissedBanners.includes(action.payload)) {
        state.dismissedBanners.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase('persist/REHYDRATE', (state, action) => {
      if (action.payload?.banners) {
        return action.payload.banners;
      }
      return state;
    });
  }
});

export const { dismissBanner } = bannersSlice.actions;
export default bannersSlice.reducer;