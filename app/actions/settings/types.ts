import { type Action } from 'redux';

/**
 * Settings action type enum
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
  SET_TOKEN_SORT_CONFIG = 'SET_TOKEN_SORT_CONFIG',
}

/**
 * Primary currency type
 * Note: Using string to maintain compatibility with existing code
 */
export type PrimaryCurrency = string;

/**
 * Token sort configuration
 */
export interface TokenSortConfig {
  key: string;
  order: 'asc' | 'desc';
  sortCallback?: string;
}

/**
 * Settings actions
 */
export interface SetSearchEngineAction extends Action<SettingsActionType.SET_SEARCH_ENGINE> {
  searchEngine: string;
}

export interface SetLockTimeAction extends Action<SettingsActionType.SET_LOCK_TIME> {
  lockTime: number;
}

export interface SetShowHexDataAction extends Action<SettingsActionType.SET_SHOW_HEX_DATA> {
  showHexData: boolean;
}

export interface SetShowCustomNonceAction extends Action<SettingsActionType.SET_SHOW_CUSTOM_NONCE> {
  showCustomNonce: boolean;
}

export interface SetHideZeroBalanceTokensAction extends Action<SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS> {
  hideZeroBalanceTokens: boolean;
}

export interface SetUseBlockieIconAction extends Action<SettingsActionType.SET_USE_BLOCKIE_ICON> {
  useBlockieIcon: boolean;
}

export interface SetPrimaryCurrencyAction extends Action<SettingsActionType.SET_PRIMARY_CURRENCY> {
  primaryCurrency: PrimaryCurrency;
}

export interface SetShowFiatOnTestnetsAction extends Action<SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS> {
  showFiatOnTestnets: boolean;
}

export interface ToggleBasicFunctionalityAction extends Action<SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY> {
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationsAction extends Action<SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS> {
  deviceNotificationEnabled: boolean;
}

export interface SetTokenSortConfigAction extends Action<SettingsActionType.SET_TOKEN_SORT_CONFIG> {
  tokenSortConfig: TokenSortConfig;
}

/**
 * Settings actions union type
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
  | ToggleDeviceNotificationsAction
  | SetTokenSortConfigAction;
