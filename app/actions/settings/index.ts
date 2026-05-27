interface TokenSortConfig {
  key: string;
  order: string;
  sortCallback?: string;
}

export function setSearchEngine(searchEngine: string): { type: 'SET_SEARCH_ENGINE'; searchEngine: string } {
  return {
    type: 'SET_SEARCH_ENGINE',
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): { type: 'SET_SHOW_HEX_DATA'; showHexData: boolean } {
  return {
    type: 'SET_SHOW_HEX_DATA',
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean): { type: 'SET_SHOW_CUSTOM_NONCE'; showCustomNonce: boolean } {
  return {
    type: 'SET_SHOW_CUSTOM_NONCE',
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean): { type: 'SET_SHOW_FIAT_ON_TESTNETS'; showFiatOnTestnets: boolean } {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS',
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(hideZeroBalanceTokens: boolean): { type: 'SET_HIDE_ZERO_BALANCE_TOKENS'; hideZeroBalanceTokens: boolean } {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): { type: 'SET_LOCK_TIME'; lockTime: number } {
  return {
    type: 'SET_LOCK_TIME',
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string): { type: 'SET_PRIMARY_CURRENCY'; primaryCurrency: string } {
  return {
    type: 'SET_PRIMARY_CURRENCY',
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean): { type: 'SET_USE_BLOCKIE_ICON'; useBlockieIcon: boolean } {
  return {
    type: 'SET_USE_BLOCKIE_ICON',
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean): { type: 'TOGGLE_BASIC_FUNCTIONALITY'; basicFunctionalityEnabled: boolean } {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY',
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(deviceNotificationEnabled: boolean): { type: 'TOGGLE_DEVICE_NOTIFICATIONS'; deviceNotificationEnabled: boolean } {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS',
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: TokenSortConfig): { type: 'SET_TOKEN_SORT_CONFIG'; tokenSortConfig: TokenSortConfig } {
  return {
    type: 'SET_TOKEN_SORT_CONFIG',
    tokenSortConfig,
  };
}
