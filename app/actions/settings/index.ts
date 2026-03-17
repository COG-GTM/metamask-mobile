import type { Action as ReduxAction } from 'redux';

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

export interface SetSearchEngineAction
  extends ReduxAction<SettingsActionType.SET_SEARCH_ENGINE> {
  searchEngine: string;
}

export interface SetShowHexDataAction
  extends ReduxAction<SettingsActionType.SET_SHOW_HEX_DATA> {
  showHexData: boolean;
}

export interface SetShowCustomNonceAction
  extends ReduxAction<SettingsActionType.SET_SHOW_CUSTOM_NONCE> {
  showCustomNonce: boolean;
}

export interface SetShowFiatOnTestnetsAction
  extends ReduxAction<SettingsActionType.SET_SHOW_FIAT_ON_TESTNETS> {
  showFiatOnTestnets: boolean;
}

export interface SetHideZeroBalanceTokensAction
  extends ReduxAction<SettingsActionType.SET_HIDE_ZERO_BALANCE_TOKENS> {
  hideZeroBalanceTokens: boolean;
}

export interface SetLockTimeAction
  extends ReduxAction<SettingsActionType.SET_LOCK_TIME> {
  lockTime: number;
}

export interface SetPrimaryCurrencyAction
  extends ReduxAction<SettingsActionType.SET_PRIMARY_CURRENCY> {
  primaryCurrency: string;
}

export interface SetUseBlockieIconAction
  extends ReduxAction<SettingsActionType.SET_USE_BLOCKIE_ICON> {
  useBlockieIcon: boolean;
}

export interface ToggleBasicFunctionalityAction
  extends ReduxAction<SettingsActionType.TOGGLE_BASIC_FUNCTIONALITY> {
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationAction
  extends ReduxAction<SettingsActionType.TOGGLE_DEVICE_NOTIFICATIONS> {
  deviceNotificationEnabled: boolean;
}

export interface SetTokenSortConfigAction
  extends ReduxAction<SettingsActionType.SET_TOKEN_SORT_CONFIG> {
  tokenSortConfig: Record<string, unknown>;
}

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
  tokenSortConfig: Record<string, unknown>,
): SetTokenSortConfigAction {
  return {
    type: SettingsActionType.SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
