import { createSlice } from '@reduxjs/toolkit';
import AppConstants from '../../core/AppConstants';
import {
  ActionType,
  type SetHideZeroBalanceTokensAction,
  type SetLockTimeAction,
  type SetPrimaryCurrencyAction,
  type SetSearchEngineAction,
  type SetShowCustomNonceAction,
  type SetShowFiatOnTestnetsAction,
  type SetShowHexDataAction,
  type SetUseBlockieIconAction,
  type ToggleBasicFunctionalityAction,
  type ToggleDeviceNotificationAction,
} from '../../actions/settings';

export interface SettingsState {
  searchEngine: string;
  primaryCurrency: string;
  lockTime: number;
  useBlockieIcon: boolean;
  hideZeroBalanceTokens: boolean;
  basicFunctionalityEnabled: boolean;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  deviceNotificationEnabled?: boolean;
}

export const initialState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1, // Disabled by default
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

// Case reducers spread into a new object (rather than mutating the draft) so a
// fresh state reference is returned even when the value is unchanged, matching
// the legacy reducer. SET_TOKEN_SORT_CONFIG intentionally has no case.
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SET_SEARCH_ENGINE,
        (state, action: SetSearchEngineAction) => ({
          ...state,
          searchEngine: action.searchEngine,
        }),
      )
      .addCase(
        ActionType.SET_LOCK_TIME,
        (state, action: SetLockTimeAction) => ({
          ...state,
          lockTime: action.lockTime,
        }),
      )
      .addCase(
        ActionType.SET_SHOW_HEX_DATA,
        (state, action: SetShowHexDataAction) => ({
          ...state,
          showHexData: action.showHexData,
        }),
      )
      .addCase(
        ActionType.SET_SHOW_CUSTOM_NONCE,
        (state, action: SetShowCustomNonceAction) => ({
          ...state,
          showCustomNonce: action.showCustomNonce,
        }),
      )
      .addCase(
        ActionType.SET_HIDE_ZERO_BALANCE_TOKENS,
        (state, action: SetHideZeroBalanceTokensAction) => ({
          ...state,
          hideZeroBalanceTokens: action.hideZeroBalanceTokens,
        }),
      )
      .addCase(
        ActionType.SET_USE_BLOCKIE_ICON,
        (state, action: SetUseBlockieIconAction) => ({
          ...state,
          useBlockieIcon: action.useBlockieIcon,
        }),
      )
      .addCase(
        ActionType.SET_PRIMARY_CURRENCY,
        (state, action: SetPrimaryCurrencyAction) => ({
          ...state,
          primaryCurrency: action.primaryCurrency,
        }),
      )
      .addCase(
        ActionType.SET_SHOW_FIAT_ON_TESTNETS,
        (state, action: SetShowFiatOnTestnetsAction) => ({
          ...state,
          showFiatOnTestnets: action.showFiatOnTestnets,
        }),
      )
      .addCase(
        ActionType.TOGGLE_BASIC_FUNCTIONALITY,
        (state, action: ToggleBasicFunctionalityAction) => ({
          ...state,
          basicFunctionalityEnabled: action.basicFunctionalityEnabled,
        }),
      )
      .addCase(
        ActionType.TOGGLE_DEVICE_NOTIFICATIONS,
        (state, action: ToggleDeviceNotificationAction) => ({
          ...state,
          deviceNotificationEnabled: action.deviceNotificationEnabled,
        }),
      );
  },
});

export default settingsSlice.reducer;
