interface TokenSortConfig {
  key: string;
  order: string;
  sortCallback: string;
}

export function setSearchEngine(searchEngine: string) {
  return {
    type: 'SET_SEARCH_ENGINE' as const,
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean) {
  return {
    type: 'SET_SHOW_HEX_DATA' as const,
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean) {
  return {
    type: 'SET_SHOW_CUSTOM_NONCE' as const,
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean) {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS' as const,
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(hideZeroBalanceTokens: boolean) {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS' as const,
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number) {
  return {
    type: 'SET_LOCK_TIME' as const,
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string) {
  return {
    type: 'SET_PRIMARY_CURRENCY' as const,
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean) {
  return {
    type: 'SET_USE_BLOCKIE_ICON' as const,
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean) {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY' as const,
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(deviceNotificationEnabled: boolean) {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS' as const,
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: TokenSortConfig) {
  return {
    type: 'SET_TOKEN_SORT_CONFIG' as const,
    tokenSortConfig,
  };
}
