export interface SettingsAction {
  type:
    | 'SET_SEARCH_ENGINE'
    | 'SET_SHOW_HEX_DATA'
    | 'SET_SHOW_CUSTOM_NONCE'
    | 'SET_SHOW_FIAT_ON_TESTNETS'
    | 'SET_HIDE_ZERO_BALANCE_TOKENS'
    | 'SET_LOCK_TIME'
    | 'SET_PRIMARY_CURRENCY'
    | 'SET_USE_BLOCKIE_ICON'
    | 'TOGGLE_BASIC_FUNCTIONALITY'
    | 'TOGGLE_DEVICE_NOTIFICATIONS'
    | 'SET_TOKEN_SORT_CONFIG';
  searchEngine?: string;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  hideZeroBalanceTokens?: boolean;
  lockTime?: number;
  primaryCurrency?: string;
  useBlockieIcon?: boolean;
  basicFunctionalityEnabled?: boolean;
  deviceNotificationEnabled?: boolean;
  tokenSortConfig?: object;
}

export function setSearchEngine(searchEngine: string): SettingsAction {
  return {
    type: 'SET_SEARCH_ENGINE',
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SettingsAction {
  return {
    type: 'SET_SHOW_HEX_DATA',
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean): SettingsAction {
  return {
    type: 'SET_SHOW_CUSTOM_NONCE',
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean): SettingsAction {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS',
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: boolean,
): SettingsAction {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SettingsAction {
  return {
    type: 'SET_LOCK_TIME',
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string): SettingsAction {
  return {
    type: 'SET_PRIMARY_CURRENCY',
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean): SettingsAction {
  return {
    type: 'SET_USE_BLOCKIE_ICON',
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(
  basicFunctionalityEnabled: boolean,
): SettingsAction {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY',
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: boolean,
): SettingsAction {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS',
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: object): SettingsAction {
  return {
    type: 'SET_TOKEN_SORT_CONFIG',
    tokenSortConfig,
  };
}
