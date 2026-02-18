import { RootState, SettingsState } from '../reducers';
import { createSelector } from 'reselect';

const selectSettings = (state: RootState) => state.settings;

export const selectShowFiatInTestnets = createSelector(
  selectSettings,
  (settingsState: SettingsState) =>
    settingsState.showFiatOnTestnets as boolean,
);

export const selectPrimaryCurrency = createSelector(
  selectSettings,
  (settingsState: SettingsState) => settingsState.primaryCurrency,
);
export const selectShowCustomNonce = createSelector(
  selectSettings,
  (settingsState: SettingsState) => settingsState.showCustomNonce,
);

export const selectBasicFunctionalityEnabled = createSelector(
  selectSettings,
  (settingsState: SettingsState) =>
    settingsState.basicFunctionalityEnabled as boolean,
);

export const selectHideZeroBalanceTokens = createSelector(
  selectSettings,
  (settingsState: SettingsState) =>
    Boolean(settingsState.hideZeroBalanceTokens),
);
