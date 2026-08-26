export const SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE' as const;
export const SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA' as const;
export const SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE' as const;
export const SET_SHOW_FIAT_ON_TESTNETS = 'SET_SHOW_FIAT_ON_TESTNETS' as const;
export const SET_HIDE_ZERO_BALANCE_TOKENS =
  'SET_HIDE_ZERO_BALANCE_TOKENS' as const;
export const SET_LOCK_TIME = 'SET_LOCK_TIME' as const;
export const SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY' as const;
export const SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON' as const;
export const TOGGLE_BASIC_FUNCTIONALITY = 'TOGGLE_BASIC_FUNCTIONALITY' as const;
export const TOGGLE_DEVICE_NOTIFICATIONS =
  'TOGGLE_DEVICE_NOTIFICATIONS' as const;
export const SET_TOKEN_SORT_CONFIG = 'SET_TOKEN_SORT_CONFIG' as const;

interface SettingAction {
  type:
    | typeof SET_SEARCH_ENGINE
    | typeof SET_SHOW_HEX_DATA
    | typeof SET_SHOW_CUSTOM_NONCE
    | typeof SET_SHOW_FIAT_ON_TESTNETS
    | typeof SET_HIDE_ZERO_BALANCE_TOKENS
    | typeof SET_LOCK_TIME
    | typeof SET_PRIMARY_CURRENCY
    | typeof SET_USE_BLOCKIE_ICON
    | typeof TOGGLE_BASIC_FUNCTIONALITY
    | typeof TOGGLE_DEVICE_NOTIFICATIONS
    | typeof SET_TOKEN_SORT_CONFIG;
  searchEngine?: unknown;
  showHexData?: unknown;
  showCustomNonce?: unknown;
  showFiatOnTestnets?: unknown;
  hideZeroBalanceTokens?: unknown;
  lockTime?: unknown;
  primaryCurrency?: unknown;
  useBlockieIcon?: unknown;
  basicFunctionalityEnabled?: unknown;
  deviceNotificationEnabled?: unknown;
  tokenSortConfig?: unknown;
}

export type Action = SettingAction;

export function setSearchEngine(searchEngine: unknown): SettingAction {
  return {
    type: SET_SEARCH_ENGINE,
    searchEngine,
  };
}

export function setShowHexData(showHexData: unknown): SettingAction {
  return {
    type: SET_SHOW_HEX_DATA,
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: unknown): SettingAction {
  return {
    type: SET_SHOW_CUSTOM_NONCE,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(
  showFiatOnTestnets: unknown,
): SettingAction {
  return {
    type: SET_SHOW_FIAT_ON_TESTNETS,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: unknown,
): SettingAction {
  return {
    type: SET_HIDE_ZERO_BALANCE_TOKENS,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: unknown): SettingAction {
  return {
    type: SET_LOCK_TIME,
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: unknown): SettingAction {
  return {
    type: SET_PRIMARY_CURRENCY,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: unknown): SettingAction {
  return {
    type: SET_USE_BLOCKIE_ICON,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(
  basicFunctionalityEnabled: unknown,
): SettingAction {
  return {
    type: TOGGLE_BASIC_FUNCTIONALITY,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: unknown,
): SettingAction {
  return {
    type: TOGGLE_DEVICE_NOTIFICATIONS,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: unknown): SettingAction {
  return {
    type: SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
