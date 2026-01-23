export const SettingsActionTypes = {
  SET_SEARCH_ENGINE: 'SET_SEARCH_ENGINE',
  SET_SHOW_HEX_DATA: 'SET_SHOW_HEX_DATA',
  SET_SHOW_CUSTOM_NONCE: 'SET_SHOW_CUSTOM_NONCE',
  SET_SHOW_FIAT_ON_TESTNETS: 'SET_SHOW_FIAT_ON_TESTNETS',
  SET_HIDE_ZERO_BALANCE_TOKENS: 'SET_HIDE_ZERO_BALANCE_TOKENS',
  SET_LOCK_TIME: 'SET_LOCK_TIME',
  SET_PRIMARY_CURRENCY: 'SET_PRIMARY_CURRENCY',
  SET_USE_BLOCKIE_ICON: 'SET_USE_BLOCKIE_ICON',
  TOGGLE_BASIC_FUNCTIONALITY: 'TOGGLE_BASIC_FUNCTIONALITY',
  TOGGLE_DEVICE_NOTIFICATIONS: 'TOGGLE_DEVICE_NOTIFICATIONS',
  SET_TOKEN_SORT_CONFIG: 'SET_TOKEN_SORT_CONFIG',
} as const;

export interface SetSearchEngineAction {
  type: typeof SettingsActionTypes.SET_SEARCH_ENGINE;
  searchEngine: string;
}

export interface SetShowHexDataAction {
  type: typeof SettingsActionTypes.SET_SHOW_HEX_DATA;
  showHexData: boolean;
}

export interface SetShowCustomNonceAction {
  type: typeof SettingsActionTypes.SET_SHOW_CUSTOM_NONCE;
  showCustomNonce: boolean;
}

export interface SetShowFiatOnTestnetsAction {
  type: typeof SettingsActionTypes.SET_SHOW_FIAT_ON_TESTNETS;
  showFiatOnTestnets: boolean;
}

export interface SetHideZeroBalanceTokensAction {
  type: typeof SettingsActionTypes.SET_HIDE_ZERO_BALANCE_TOKENS;
  hideZeroBalanceTokens: boolean;
}

export interface SetLockTimeAction {
  type: typeof SettingsActionTypes.SET_LOCK_TIME;
  lockTime: number;
}

export interface SetPrimaryCurrencyAction {
  type: typeof SettingsActionTypes.SET_PRIMARY_CURRENCY;
  primaryCurrency: string;
}

export interface SetUseBlockieIconAction {
  type: typeof SettingsActionTypes.SET_USE_BLOCKIE_ICON;
  useBlockieIcon: boolean;
}

export interface ToggleBasicFunctionalityAction {
  type: typeof SettingsActionTypes.TOGGLE_BASIC_FUNCTIONALITY;
  basicFunctionalityEnabled: boolean;
}

export interface ToggleDeviceNotificationAction {
  type: typeof SettingsActionTypes.TOGGLE_DEVICE_NOTIFICATIONS;
  deviceNotificationEnabled: boolean;
}

export interface TokenSortConfig {
  key: string;
  order: 'asc' | 'desc';
  sortCallback?: string;
}

export interface SetTokenSortConfigAction {
  type: typeof SettingsActionTypes.SET_TOKEN_SORT_CONFIG;
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
    type: SettingsActionTypes.SET_SEARCH_ENGINE,
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: SettingsActionTypes.SET_SHOW_HEX_DATA,
    showHexData,
  };
}

export function setShowCustomNonce(
  showCustomNonce: boolean,
): SetShowCustomNonceAction {
  return {
    type: SettingsActionTypes.SET_SHOW_CUSTOM_NONCE,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(
  showFiatOnTestnets: boolean,
): SetShowFiatOnTestnetsAction {
  return {
    type: SettingsActionTypes.SET_SHOW_FIAT_ON_TESTNETS,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: boolean,
): SetHideZeroBalanceTokensAction {
  return {
    type: SettingsActionTypes.SET_HIDE_ZERO_BALANCE_TOKENS,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: SettingsActionTypes.SET_LOCK_TIME,
    lockTime,
  };
}

export function setPrimaryCurrency(
  primaryCurrency: string,
): SetPrimaryCurrencyAction {
  return {
    type: SettingsActionTypes.SET_PRIMARY_CURRENCY,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(
  useBlockieIcon: boolean,
): SetUseBlockieIconAction {
  return {
    type: SettingsActionTypes.SET_USE_BLOCKIE_ICON,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(
  basicFunctionalityEnabled: boolean,
): ToggleBasicFunctionalityAction {
  return {
    type: SettingsActionTypes.TOGGLE_BASIC_FUNCTIONALITY,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: boolean,
): ToggleDeviceNotificationAction {
  return {
    type: SettingsActionTypes.TOGGLE_DEVICE_NOTIFICATIONS,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(
  tokenSortConfig: TokenSortConfig,
): SetTokenSortConfigAction {
  return {
    type: SettingsActionTypes.SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
