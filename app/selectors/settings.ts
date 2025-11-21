import { RootState } from '../reducers';
import { createSelector } from 'reselect';

const selectSettings = (state: RootState) => state.settings;

export const selectShowFiatInTestnets = createSelector(
  selectSettings,
  (settingsState) =>
    settingsState.showFiatOnTestnets as boolean,
);

export const selectPrimaryCurrency = createSelector(
  selectSettings,
  (settingsState) => settingsState.primaryCurrency,
);
export const selectShowCustomNonce = createSelector(
  selectSettings,
  (settingsState) => settingsState.showCustomNonce,
);

export const selectBasicFunctionalityEnabled = createSelector(
  selectSettings,
  (settingsState) =>
    settingsState.basicFunctionalityEnabled as boolean,
);

export const selectHideZeroBalanceTokens = createSelector(
  selectSettings,
  (settingsState) =>
    Boolean(settingsState.hideZeroBalanceTokens),
);
