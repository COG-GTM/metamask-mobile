import { type Action } from 'redux';

/**
 * Token sort configuration
 */
export interface TokenSortConfig {
  key: string;
  order: string;
  sortCallback: string;
}

/**
 * Settings action type enum
 */
export enum SettingsActionType {
  SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE',
  SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA',
  SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE',
  SET_SHOW_FIAT_ON_TESTNETS = 'SET_SHOW_FIAT_ON_TESTNETS',
  SET_HIDE_ZERO_BALANCE_TOKENS = 'SET_HIDE_ZERO_BALANCE_TOKENS',
  SET_LOCK_TIME = 'SET_LOCK_TIME',
  SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY',
  SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON',
  TOGGLE_BASIC_FUNCTIONALITY = 'TOGGLE_BASIC_FUNCTIONALITY',
  TOGGLE_DEVICE_NOTIFICATIONS = 'TOGGLE_DEVICE_NOTIFICATIONS',
  SET_TOKEN_SORT_CONFIG = 'SET_TOKEN_SORT_CONFIG',
}

/**
 * Settings action types
 */
export type SetSearchEngineAction = Action<SettingsActionType.SET_SEARCH_ENGINE> & {
  searchEngine: string;
};

export type SetShowHexDataAction = Action<SettingsActionType.SET_SHOW_HEX_DATA> & {
  showHexData: boolean;
};

export type SetShowCustomNonceAction = Action<SettingsActionType.SET_SHOW_CUSTOM_NONCE> & {
  showCustomNonce: boolean;
};

export type SetShowFiatOnTestnetsAction = Action<SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS> & {
  showFiatOnTestnets: boolean;
};

export type SetHideZeroBalanceTokensAction = Action<SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS> & {
  hideZeroBalanceTokens: boolean;
};

export type SetLockTimeAction = Action<SettingsActionType.SET_LOCK_TIME> & {
  lockTime: number;
};

export type SetPrimaryCurrencyAction = Action<SettingsActionType.SET_PRIMARY_CURRENCY> & {
  primaryCurrency: string;
};

export type SetUseBlockieIconAction = Action<SettingsActionType.SET_USE_BLOCKIE_ICON> & {
  useBlockieIcon: boolean;
};

export type ToggleBasicFunctionalityAction = Action<SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY> & {
  basicFunctionalityEnabled: boolean;
};

export type ToggleDeviceNotificationAction = Action<SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS> & {
  deviceNotificationEnabled: boolean;
};

export type SetTokenSortConfigAction = Action<SettingsActionType.SET_TOKEN_SORT_CONFIG> & {
  tokenSortConfig: TokenSortConfig;
};

/**
 * Settings actions union type
 */
export type SettingsAction =
  | SetSearchEngineAction
  | SetShowHexDataAction
  | SetShowCustomNonceAction
  | SetShowFiatOnTestnetsAction
  | SetHideZeroBalanceTokensAction
  | SetLockTimeAction
  | SetPrimaryCurrencyAction
  | SetUseBlockieIconAction
  | ToggleBasicFunctionalityAction
  | ToggleDeviceNotificationAction
  | SetTokenSortConfigAction;
