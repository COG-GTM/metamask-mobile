import AppConstants from '../../core/AppConstants';
import {
  type SettingsAction,
  SettingsActionType,
} from '../../actions/settings/types';
import { type SettingsState } from './types';

export * from './types';

/**
 * Initial settings state
 */
export const initialSettingsState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1,
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

/**
 * Settings reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const settingsReducer = (
  state: SettingsState = initialSettingsState,
  action: SettingsAction,
): SettingsState => {
  switch (action.type) {
    case SettingsActionType.SET_SEARCH_ENGINE:
      return {
        ...state,
        searchEngine: action.searchEngine,
      };
    case SettingsActionType.SET_LOCK_TIME:
      return {
        ...state,
        lockTime: action.lockTime,
      };
    case SettingsActionType.SET_SHOW_HEX_DATA:
      return {
        ...state,
        showHexData: action.showHexData,
      };
    case SettingsActionType.SET_SHOW_CUSTOM_NONCE:
      return {
        ...state,
        showCustomNonce: action.showCustomNonce,
      };
    case SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS:
      return {
        ...state,
        hideZeroBalanceTokens: action.hideZeroBalanceTokens,
      };
    case SettingsActionType.SET_USE_BLOCKIE_ICON:
      return {
        ...state,
        useBlockieIcon: action.useBlockieIcon,
      };
    case SettingsActionType.SET_PRIMARY_CURRENCY:
      return {
        ...state,
        primaryCurrency: action.primaryCurrency,
      };
    case SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS:
      return {
        ...state,
        showFiatOnTestnets: action.showFiatOnTestnets,
      };
    case SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY:
      return {
        ...state,
        basicFunctionalityEnabled: action.basicFunctionalityEnabled,
      };
    case SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS:
      return {
        ...state,
        deviceNotificationEnabled: action.deviceNotificationEnabled,
      };
    case SettingsActionType.SET_TOKEN_SORT_CONFIG:
      return {
        ...state,
        tokenSortConfig: action.tokenSortConfig,
      };
    default:
      return state;
  }
};

export default settingsReducer;
