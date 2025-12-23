import AppConstants from '../../core/AppConstants';

export interface SettingsState {
  searchEngine: string;
  primaryCurrency: string;
  lockTime: number;
  useBlockieIcon: boolean;
  hideZeroBalanceTokens: boolean;
  basicFunctionalityEnabled: boolean;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  deviceNotificationEnabled?: boolean;
}

const initialState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1, // Disabled by default
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

interface SettingsReducerAction {
  type: string;
  searchEngine?: string;
  lockTime?: number;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  hideZeroBalanceTokens?: boolean;
  useBlockieIcon?: boolean;
  primaryCurrency?: string;
  showFiatOnTestnets?: boolean;
  basicFunctionalityEnabled?: boolean;
  deviceNotificationEnabled?: boolean;
}

const settingsReducer = (
  state: SettingsState = initialState,
  action: SettingsReducerAction,
): SettingsState => {
  switch (action.type) {
    case 'SET_SEARCH_ENGINE':
      return {
        ...state,
        searchEngine: action.searchEngine ?? state.searchEngine,
      };
    case 'SET_LOCK_TIME':
      return {
        ...state,
        lockTime: action.lockTime ?? state.lockTime,
      };
    case 'SET_SHOW_HEX_DATA':
      return {
        ...state,
        showHexData: action.showHexData,
      };
    case 'SET_SHOW_CUSTOM_NONCE':
      return {
        ...state,
        showCustomNonce: action.showCustomNonce,
      };
    case 'SET_HIDE_ZERO_BALANCE_TOKENS':
      return {
        ...state,
        hideZeroBalanceTokens: action.hideZeroBalanceTokens ?? false,
      };
    case 'SET_USE_BLOCKIE_ICON':
      return {
        ...state,
        useBlockieIcon: action.useBlockieIcon ?? true,
      };
    case 'SET_PRIMARY_CURRENCY':
      return {
        ...state,
        primaryCurrency: action.primaryCurrency ?? state.primaryCurrency,
      };
    case 'SET_SHOW_FIAT_ON_TESTNETS':
      return {
        ...state,
        showFiatOnTestnets: action.showFiatOnTestnets,
      };
    case 'TOGGLE_BASIC_FUNCTIONALITY':
      return {
        ...state,
        basicFunctionalityEnabled: action.basicFunctionalityEnabled ?? true,
      };

    case 'TOGGLE_DEVICE_NOTIFICATIONS':
      return {
        ...state,
        deviceNotificationEnabled: action.deviceNotificationEnabled,
      };

    default:
      return state;
  }
};

export default settingsReducer;
