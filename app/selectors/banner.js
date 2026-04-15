
import { createSelector } from 'reselect';

const selectBannersState = (state) => state.banners.dismissedBanners;

export const selectDismissedBanners = createSelector(
  selectBannersState,
  (dismissedBanners) => dismissedBanners
);