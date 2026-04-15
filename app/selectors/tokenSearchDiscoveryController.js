import { createSelector } from 'reselect';


const selectTokenSearchDiscoveryControllerState = (state) =>
state.engine.backgroundState.TokenSearchDiscoveryController;

export const selectRecentTokenSearches = createSelector(
  selectTokenSearchDiscoveryControllerState,
  (state) => state?.recentSearches ?? []
);