import { type Action } from 'redux';

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
 * Mirrors the (non-exported) TokenSortConfig type from
 * `@metamask/preferences-controller`.
 */
export interface TokenSortConfig {
  key: string;
  order: 'asc' | 'dsc';
  sortCallback: string;
}

export type SetSearchEngineAction =
  Action<SettingsActionType.SET_SEARCH_ENGINE> & {
    searchEngine: string;
  };

export type SetShowHexDataAction =
  Action<SettingsActionType.SET_SHOW_HEX_DATA> & {
    showHexData: boolean;
  };

export type SetShowCustomNonceAction =
  Action<SettingsActionType.SET_SHOW_CUSTOM_NONCE> & {
    showCustomNonce: boolean;
  };

export type SetShowFiatOnTestnetsAction =
  Action<SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS> & {
    showFiatOnTestnets: boolean;
  };

export type SetHideZeroBalanceTokensAction =
  Action<SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS> & {
    hideZeroBalanceTokens: boolean;
  };

export type SetLockTimeAction = Action<SettingsActionType.SET_LOCK_TIME> & {
  lockTime: number;
};

export type SetPrimaryCurrencyAction =
  Action<SettingsActionType.SET_PRIMARY_CURRENCY> & {
    primaryCurrency: string;
  };

export type SetUseBlockieIconAction =
  Action<SettingsActionType.SET_USE_BLOCKIE_ICON> & {
    useBlockieIcon: boolean;
  };

export type ToggleBasicFunctionalityAction =
  Action<SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY> & {
    basicFunctionalityEnabled: boolean;
  };

export type ToggleDeviceNotificationAction =
  Action<SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS> & {
    deviceNotificationEnabled: boolean;
  };

export type SetTokenSortConfigAction =
  Action<SettingsActionType.SET_TOKEN_SORT_CONFIG> & {
    tokenSortConfig: TokenSortConfig;
  };

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

export function setSearchEngine(searchEngine: string): SetSearchEngineAction {
  return {
    type: SettingsActionType.SET_SEARCH_ENGINE,
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: SettingsActionType.SET_SHOW_HEX_DATA,
    showHexData,
  };
}

export function setShowCustomNonce(
  showCustomNonce: boolean,
): SetShowCustomNonceAction {
  return {
    type: SettingsActionType.SET_SHOW_CUSTOM_NONCE,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(
  showFiatOnTestnets: boolean,
): SetShowFiatOnTestnetsAction {
  return {
    type: SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: boolean,
): SetHideZeroBalanceTokensAction {
  return {
    type: SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: SettingsActionType.SET_LOCK_TIME,
    lockTime,
  };
}

export function setPrimaryCurrency(
  primaryCurrency: string,
): SetPrimaryCurrencyAction {
  return {
    type: SettingsActionType.SET_PRIMARY_CURRENCY,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(
  useBlockieIcon: boolean,
): SetUseBlockieIconAction {
  return {
    type: SettingsActionType.SET_USE_BLOCKIE_ICON,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(
  basicFunctionalityEnabled: boolean,
): ToggleBasicFunctionalityAction {
  return {
    type: SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: boolean,
): ToggleDeviceNotificationAction {
  return {
    type: SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(
  tokenSortConfig: TokenSortConfig,
): SetTokenSortConfigAction {
  return {
    type: SettingsActionType.SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
