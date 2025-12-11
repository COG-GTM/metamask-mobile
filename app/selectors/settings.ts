import { RootState } from '../reducers';
import { SettingsState } from '../reducers/settings';
import { createSelector } from 'reselect';

const selectSettings = (state: RootState) => state.settings;

export const selectShowFiatInTestnets = createSelector(
  selectSettings,
  (settingsState: SettingsState) => settingsState.showFiatOnTestnets ?? false,
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
  (settingsState: SettingsState) => settingsState.basicFunctionalityEnabled,
);

export const selectHideZeroBalanceTokens = createSelector(
  selectSettings,
  (settingsState: SettingsState) =>
    Boolean(settingsState.hideZeroBalanceTokens),
);
