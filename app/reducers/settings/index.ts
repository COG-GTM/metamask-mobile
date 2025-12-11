import AppConstants from '../../core/AppConstants';

/**
 * Settings action types
 */
export enum SettingsActionType {
  SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE',
  SET_LOCK_TIME = 'SET_LOCK_TIME',
  SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA',
  SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE',
  SET_HIDE_ZERO_BALANCE_TOKENS = 'SET_HIDE_ZERO_BALANCE_TOKENS',
  SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON',
  SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY',
  SET_SHOW_FIAT_ON_TESTNETS = 'SET_SHOW_FIAT_ON_TESTNETS',
  TOGGLE_BASIC_FUNCTIONALITY = 'TOGGLE_BASIC_FUNCTIONALITY',
  TOGGLE_DEVICE_NOTIFICATIONS = 'TOGGLE_DEVICE_NOTIFICATIONS',
}

/**
 * Settings state interface
 */
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

/**
 * Settings action interfaces
 */
interface SetSearchEngineAction {
  type: SettingsActionType.SET_SEARCH_ENGINE;
  searchEngine: string;
}

interface SetLockTimeAction {
  type: SettingsActionType.SET_LOCK_TIME;
  lockTime: number;
}

interface SetShowHexDataAction {
  type: SettingsActionType.SET_SHOW_HEX_DATA;
  showHexData: boolean;
}

interface SetShowCustomNonceAction {
  type: SettingsActionType.SET_SHOW_CUSTOM_NONCE;
  showCustomNonce: boolean;
}

interface SetHideZeroBalanceTokensAction {
  type: SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS;
  hideZeroBalanceTokens: boolean;
}

interface SetUseBlockieIconAction {
  type: SettingsActionType.SET_USE_BLOCKIE_ICON;
  useBlockieIcon: boolean;
}

interface SetPrimaryCurrencyAction {
  type: SettingsActionType.SET_PRIMARY_CURRENCY;
  primaryCurrency: string;
}

interface SetShowFiatOnTestnetsAction {
  type: SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS;
  showFiatOnTestnets: boolean;
}

interface ToggleBasicFunctionalityAction {
  type: SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY;
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationsAction {
  type: SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS;
  deviceNotificationEnabled: boolean;
}

/**
 * Union type of all settings actions
 */
export type SettingsAction =
  | SetSearchEngineAction
  | SetLockTimeAction
  | SetShowHexDataAction
  | SetShowCustomNonceAction
  | SetHideZeroBalanceTokensAction
  | SetUseBlockieIconAction
  | SetPrimaryCurrencyAction
  | SetShowFiatOnTestnetsAction
  | ToggleBasicFunctionalityAction
  | ToggleDeviceNotificationsAction;

/**
 * Initial settings state
 */
export const settingsInitialState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1, // Disabled by default
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

/**
 * Settings reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const settingsReducer = (
  state: SettingsState = settingsInitialState,
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
    default:
      return state;
  }
};

export default settingsReducer;
