import type { Action } from 'redux';

export interface TokenSortConfig {
  key: string;
  order: 'asc' | 'dsc';
  sortCallback: string;
}

export interface SetSearchEngineAction extends Action<'SET_SEARCH_ENGINE'> {
  searchEngine: string;
}

export interface SetShowHexDataAction extends Action<'SET_SHOW_HEX_DATA'> {
  showHexData: boolean;
}

export interface SetShowCustomNonceAction
  extends Action<'SET_SHOW_CUSTOM_NONCE'> {
  showCustomNonce: boolean;
}

export interface SetShowFiatOnTestnetsAction
  extends Action<'SET_SHOW_FIAT_ON_TESTNETS'> {
  showFiatOnTestnets: boolean;
}

export interface SetHideZeroBalanceTokensAction
  extends Action<'SET_HIDE_ZERO_BALANCE_TOKENS'> {
  hideZeroBalanceTokens: boolean;
}

export interface SetLockTimeAction extends Action<'SET_LOCK_TIME'> {
  lockTime: number;
}

export interface SetPrimaryCurrencyAction
  extends Action<'SET_PRIMARY_CURRENCY'> {
  primaryCurrency: string;
}

export interface SetUseBlockieIconAction
  extends Action<'SET_USE_BLOCKIE_ICON'> {
  useBlockieIcon: boolean;
}

export interface ToggleBasicFunctionalityAction
  extends Action<'TOGGLE_BASIC_FUNCTIONALITY'> {
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationAction
  extends Action<'TOGGLE_DEVICE_NOTIFICATIONS'> {
  deviceNotificationEnabled: boolean;
}

export interface SetTokenSortConfigAction
  extends Action<'SET_TOKEN_SORT_CONFIG'> {
  tokenSortConfig: TokenSortConfig;
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
    type: 'SET_SEARCH_ENGINE',
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: 'SET_SHOW_HEX_DATA',
    showHexData,
  };
}

export function setShowCustomNonce(
  showCustomNonce: boolean,
): SetShowCustomNonceAction {
  return {
    type: 'SET_SHOW_CUSTOM_NONCE',
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(
  showFiatOnTestnets: boolean,
): SetShowFiatOnTestnetsAction {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS',
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: boolean,
): SetHideZeroBalanceTokensAction {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: 'SET_LOCK_TIME',
    lockTime,
  };
}

export function setPrimaryCurrency(
  primaryCurrency: string,
): SetPrimaryCurrencyAction {
  return {
    type: 'SET_PRIMARY_CURRENCY',
    primaryCurrency,
  };
}

export function setUseBlockieIcon(
  useBlockieIcon: boolean,
): SetUseBlockieIconAction {
  return {
    type: 'SET_USE_BLOCKIE_ICON',
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(
  basicFunctionalityEnabled: boolean,
): ToggleBasicFunctionalityAction {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY',
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: boolean,
): ToggleDeviceNotificationAction {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS',
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(
  tokenSortConfig: TokenSortConfig,
): SetTokenSortConfigAction {
  return {
    type: 'SET_TOKEN_SORT_CONFIG',
    tokenSortConfig,
  };
}
