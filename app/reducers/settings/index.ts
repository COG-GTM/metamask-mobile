/* eslint-disable @typescript-eslint/default-param-last */
import AppConstants from '../../core/AppConstants';
import { ActionType, SettingsAction } from '../../actions/settings';
import { SettingsState } from '../../actions/settings/state';

export type { SettingsState } from '../../actions/settings/state';

export const initialState: Readonly<SettingsState> = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1, // Disabled by default
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

const settingsReducer = (
  state: SettingsState = initialState,
  action: SettingsAction,
): SettingsState => {
  switch (action.type) {
    case ActionType.SET_SEARCH_ENGINE:
      return {
        ...state,
        searchEngine: action.searchEngine,
      };
    case ActionType.SET_LOCK_TIME:
      return {
        ...state,
        lockTime: action.lockTime,
      };
    case ActionType.SET_SHOW_HEX_DATA:
      return {
        ...state,
        showHexData: action.showHexData,
      };
    case ActionType.SET_SHOW_CUSTOM_NONCE:
      return {
        ...state,
        showCustomNonce: action.showCustomNonce,
      };
    case ActionType.SET_HIDE_ZERO_BALANCE_TOKENS:
      return {
        ...state,
        hideZeroBalanceTokens: action.hideZeroBalanceTokens,
      };
    case ActionType.SET_USE_BLOCKIE_ICON:
      return {
        ...state,
        useBlockieIcon: action.useBlockieIcon,
      };
    case ActionType.SET_PRIMARY_CURRENCY:
      return {
        ...state,
        primaryCurrency: action.primaryCurrency,
      };
    case ActionType.SET_SHOW_FIAT_ON_TESTNETS:
      return {
        ...state,
        showFiatOnTestnets: action.showFiatOnTestnets,
      };
    case ActionType.TOGGLE_BASIC_FUNCTIONALITY:
      return {
        ...state,
        basicFunctionalityEnabled: action.basicFunctionalityEnabled,
      };
    case ActionType.TOGGLE_DEVICE_NOTIFICATIONS:
      return {
        ...state,
        deviceNotificationEnabled: action.deviceNotificationEnabled,
      };
    case ActionType.SET_TOKEN_SORT_CONFIG:
      return {
        ...state,
        tokenSortConfig: action.tokenSortConfig,
      };
    default:
      return state;
  }
};

export default settingsReducer;
