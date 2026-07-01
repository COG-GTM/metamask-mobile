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

export type TokenSortConfig = Record<string, unknown>;

export function setSearchEngine(searchEngine: string) {
  return {
    type: SET_SEARCH_ENGINE,
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean) {
  return {
    type: SET_SHOW_HEX_DATA,
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean) {
  return {
    type: SET_SHOW_CUSTOM_NONCE,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean) {
  return {
    type: SET_SHOW_FIAT_ON_TESTNETS,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(hideZeroBalanceTokens: boolean) {
  return {
    type: SET_HIDE_ZERO_BALANCE_TOKENS,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number) {
  return {
    type: SET_LOCK_TIME,
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string) {
  return {
    type: SET_PRIMARY_CURRENCY,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean) {
  return {
    type: SET_USE_BLOCKIE_ICON,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean) {
  return {
    type: TOGGLE_BASIC_FUNCTIONALITY,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(deviceNotificationEnabled: boolean) {
  return {
    type: TOGGLE_DEVICE_NOTIFICATIONS,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: TokenSortConfig) {
  return {
    type: SET_TOKEN_SORT_CONFIG,
    tokenSortConfig,
  };
}
