/* eslint-disable import/prefer-default-export */
import type { Action as ReduxAction } from 'redux';

export enum ActionType {
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
  extends ReduxAction<ActionType.SET_SEARCH_ENGINE> {
  searchEngine: string;
}

export interface SetShowHexDataAction
  extends ReduxAction<ActionType.SET_SHOW_HEX_DATA> {
  showHexData: boolean;
}

export interface SetShowCustomNonceAction
  extends ReduxAction<ActionType.SET_SHOW_CUSTOM_NONCE> {
  showCustomNonce: boolean;
}

export interface SetShowFiatOnTestnetsAction
  extends ReduxAction<ActionType.SET_SHOW_FIAT_ON_TESTNETS> {
  showFiatOnTestnets: boolean;
}

export interface SetHideZeroBalanceTokensAction
  extends ReduxAction<ActionType.SET_HIDE_ZERO_BALANCE_TOKENS> {
  hideZeroBalanceTokens: boolean;
}

export interface SetLockTimeAction
  extends ReduxAction<ActionType.SET_LOCK_TIME> {
  lockTime: number;
}

export interface SetPrimaryCurrencyAction
  extends ReduxAction<ActionType.SET_PRIMARY_CURRENCY> {
  primaryCurrency: string;
}

export interface SetUseBlockieIconAction
  extends ReduxAction<ActionType.SET_USE_BLOCKIE_ICON> {
  useBlockieIcon: boolean;
}

export interface ToggleBasicFunctionalityAction
  extends ReduxAction<ActionType.TOGGLE_BASIC_FUNCTIONALITY> {
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationsAction
  extends ReduxAction<ActionType.TOGGLE_DEVICE_NOTIFICATIONS> {
  deviceNotificationEnabled: boolean;
}

export interface SetTokenSortConfigAction
  extends ReduxAction<ActionType.SET_TOKEN_SORT_CONFIG> {
  tokenSortConfig: string;
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
  | ToggleDeviceNotificationsAction
  | SetTokenSortConfigAction;

export const setSearchEngine = (
  searchEngine: string,
): SetSearchEngineAction => ({
  type: ActionType.SET_SEARCH_ENGINE,
  searchEngine,
});

export const setShowHexData = (showHexData: boolean): SetShowHexDataAction => ({
  type: ActionType.SET_SHOW_HEX_DATA,
  showHexData,
});

export const setShowCustomNonce = (
  showCustomNonce: boolean,
): SetShowCustomNonceAction => ({
  type: ActionType.SET_SHOW_CUSTOM_NONCE,
  showCustomNonce,
});

export const setShowFiatOnTestnets = (
  showFiatOnTestnets: boolean,
): SetShowFiatOnTestnetsAction => ({
  type: ActionType.SET_SHOW_FIAT_ON_TESTNETS,
  showFiatOnTestnets,
});

export const setHideZeroBalanceTokens = (
  hideZeroBalanceTokens: boolean,
): SetHideZeroBalanceTokensAction => ({
  type: ActionType.SET_HIDE_ZERO_BALANCE_TOKENS,
  hideZeroBalanceTokens,
});

export const setLockTime = (lockTime: number): SetLockTimeAction => ({
  type: ActionType.SET_LOCK_TIME,
  lockTime,
});

export const setPrimaryCurrency = (
  primaryCurrency: string,
): SetPrimaryCurrencyAction => ({
  type: ActionType.SET_PRIMARY_CURRENCY,
  primaryCurrency,
});

export const setUseBlockieIcon = (
  useBlockieIcon: boolean,
): SetUseBlockieIconAction => ({
  type: ActionType.SET_USE_BLOCKIE_ICON,
  useBlockieIcon,
});

export const toggleBasicFunctionality = (
  basicFunctionalityEnabled: boolean,
): ToggleBasicFunctionalityAction => ({
  type: ActionType.TOGGLE_BASIC_FUNCTIONALITY,
  basicFunctionalityEnabled,
});

export const toggleDeviceNotification = (
  deviceNotificationEnabled: boolean,
): ToggleDeviceNotificationsAction => ({
  type: ActionType.TOGGLE_DEVICE_NOTIFICATIONS,
  deviceNotificationEnabled,
});

export const setTokenSortConfig = (
  tokenSortConfig: string,
): SetTokenSortConfigAction => ({
  type: ActionType.SET_TOKEN_SORT_CONFIG,
  tokenSortConfig,
});
