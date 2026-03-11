export const SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE' as const;
export const SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA' as const;
export const SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE' as const;
export const SET_SHOW_FIAT_ON_TESTNETS = 'SET_SHOW_FIAT_ON_TESTNETS' as const;
export const SET_HIDE_ZERO_BALANCE_TOKENS = 'SET_HIDE_ZERO_BALANCE_TOKENS' as const;
export const SET_LOCK_TIME = 'SET_LOCK_TIME' as const;
export const SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY' as const;
export const SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON' as const;
export const TOGGLE_BASIC_FUNCTIONALITY = 'TOGGLE_BASIC_FUNCTIONALITY' as const;
export const TOGGLE_DEVICE_NOTIFICATIONS = 'TOGGLE_DEVICE_NOTIFICATIONS' as const;
export const SET_TOKEN_SORT_CONFIG = 'SET_TOKEN_SORT_CONFIG' as const;

interface SetSearchEngineAction {
  type: typeof SET_SEARCH_ENGINE;
  searchEngine: string;
}

interface SetShowHexDataAction {
  type: typeof SET_SHOW_HEX_DATA;
  showHexData: boolean;
}

interface SetShowCustomNonceAction {
  type: typeof SET_SHOW_CUSTOM_NONCE;
  showCustomNonce: boolean;
}

interface SetShowFiatOnTestnetsAction {
  type: typeof SET_SHOW_FIAT_ON_TESTNETS;
  showFiatOnTestnets: boolean;
}

interface SetHideZeroBalanceTokensAction {
  type: typeof SET_HIDE_ZERO_BALANCE_TOKENS;
  hideZeroBalanceTokens: boolean;
}

interface SetLockTimeAction {
  type: typeof SET_LOCK_TIME;
  lockTime: number;
}

interface SetPrimaryCurrencyAction {
  type: typeof SET_PRIMARY_CURRENCY;
  primaryCurrency: string;
}

interface SetUseBlockieIconAction {
  type: typeof SET_USE_BLOCKIE_ICON;
  useBlockieIcon: boolean;
}

interface ToggleBasicFunctionalityAction {
  type: typeof TOGGLE_BASIC_FUNCTIONALITY;
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationAction {
  type: typeof TOGGLE_DEVICE_NOTIFICATIONS;
  deviceNotificationEnabled: boolean;
}

interface SetTokenSortConfigAction {
  type: typeof SET_TOKEN_SORT_CONFIG;
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
    type: SET_SEARCH_ENGINE,
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: SET_SHOW_HEX_DATA,
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean): SetShowCustomNonceAction {
  return {
    type: SET_SHOW_CUSTOM_NONCE,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean): SetShowFiatOnTestnetsAction {
  return {
    type: SET_SHOW_FIAT_ON_TESTNETS,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(hideZeroBalanceTokens: boolean): SetHideZeroBalanceTokensAction {
  return {
    type: SET_HIDE_ZERO_BALANCE_TOKENS,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: SET_LOCK_TIME,
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string): SetPrimaryCurrencyAction {
  return {
    type: SET_PRIMARY_CURRENCY,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean): SetUseBlockieIconAction {
  return {
    type: SET_USE_BLOCKIE_ICON,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean): ToggleBasicFunctionalityAction {
  return {
    type: TOGGLE_BASIC_FUNCTIONALITY,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(deviceNotificationEnabled: boolean): ToggleDeviceNotificationAction {
  return {
    type: TOGGLE_DEVICE_NOTIFICATIONS,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: Record<string, unknown>): SetTokenSortConfigAction {
  return {
    type: SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
