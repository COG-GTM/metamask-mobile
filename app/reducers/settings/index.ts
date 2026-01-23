import AppConstants from '../../core/AppConstants';
import {
  SettingsActionTypes,
  SettingsAction,
  TokenSortConfig,
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
  tokenSortConfig?: TokenSortConfig;
}

export const settingsInitialState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1,
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

/* eslint-disable @typescript-eslint/default-param-last */
const settingsReducer = (
  state: SettingsState = settingsInitialState,
  action: SettingsAction,
): SettingsState => {
  switch (action.type) {
    case SettingsActionTypes.SET_SEARCH_ENGINE:
      return {
        ...state,
        searchEngine: action.searchEngine,
      };
    case SettingsActionTypes.SET_LOCK_TIME:
      return {
        ...state,
        lockTime: action.lockTime,
      };
    case SettingsActionTypes.SET_SHOW_HEX_DATA:
      return {
        ...state,
        showHexData: action.showHexData,
      };
    case SettingsActionTypes.SET_SHOW_CUSTOM_NONCE:
      return {
        ...state,
        showCustomNonce: action.showCustomNonce,
      };
    case SettingsActionTypes.SET_HIDE_ZERO_BALANCE_TOKENS:
      return {
        ...state,
        hideZeroBalanceTokens: action.hideZeroBalanceTokens,
      };
    case SettingsActionTypes.SET_USE_BLOCKIE_ICON:
      return {
        ...state,
        useBlockieIcon: action.useBlockieIcon,
      };
    case SettingsActionTypes.SET_PRIMARY_CURRENCY:
      return {
        ...state,
        primaryCurrency: action.primaryCurrency,
      };
    case SettingsActionTypes.SET_SHOW_FIAT_ON_TESTNETS:
      return {
        ...state,
        showFiatOnTestnets: action.showFiatOnTestnets,
      };
    case SettingsActionTypes.TOGGLE_BASIC_FUNCTIONALITY:
      return {
        ...state,
        basicFunctionalityEnabled: action.basicFunctionalityEnabled,
      };
    case SettingsActionTypes.TOGGLE_DEVICE_NOTIFICATIONS:
      return {
        ...state,
        deviceNotificationEnabled: action.deviceNotificationEnabled,
      };
    case SettingsActionTypes.SET_TOKEN_SORT_CONFIG:
      return {
        ...state,
        tokenSortConfig: action.tokenSortConfig,
      };
    default:
      return state;
  }
};

export default settingsReducer;
