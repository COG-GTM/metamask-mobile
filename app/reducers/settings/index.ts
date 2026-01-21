import { Action } from 'redux';
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

interface SetSearchEngineAction extends Action<'SET_SEARCH_ENGINE'> {
  searchEngine: string;
}

interface SetLockTimeAction extends Action<'SET_LOCK_TIME'> {
  lockTime: number;
}

interface SetShowHexDataAction extends Action<'SET_SHOW_HEX_DATA'> {
  showHexData: boolean;
}

interface SetShowCustomNonceAction extends Action<'SET_SHOW_CUSTOM_NONCE'> {
  showCustomNonce: boolean;
}

interface SetHideZeroBalanceTokensAction extends Action<'SET_HIDE_ZERO_BALANCE_TOKENS'> {
  hideZeroBalanceTokens: boolean;
}

interface SetUseBlockieIconAction extends Action<'SET_USE_BLOCKIE_ICON'> {
  useBlockieIcon: boolean;
}

interface SetPrimaryCurrencyAction extends Action<'SET_PRIMARY_CURRENCY'> {
  primaryCurrency: string;
}

interface SetShowFiatOnTestnetsAction extends Action<'SET_SHOW_FIAT_ON_TESTNETS'> {
  showFiatOnTestnets: boolean;
}

interface ToggleBasicFunctionalityAction extends Action<'TOGGLE_BASIC_FUNCTIONALITY'> {
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationsAction extends Action<'TOGGLE_DEVICE_NOTIFICATIONS'> {
  deviceNotificationEnabled: boolean;
}

type SettingsAction =
  | SetSearchEngineAction
  | SetLockTimeAction
  | SetShowHexDataAction
  | SetShowCustomNonceAction
  | SetHideZeroBalanceTokensAction
  | SetUseBlockieIconAction
  | SetPrimaryCurrencyAction
  | SetShowFiatOnTestnetsAction
  | ToggleBasicFunctionalityAction
  | ToggleDeviceNotificationsAction
  | Action<string>;

const initialState: SettingsState = {
  searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
  primaryCurrency: 'ETH',
  lockTime: -1,
  useBlockieIcon: true,
  hideZeroBalanceTokens: false,
  basicFunctionalityEnabled: true,
};

const settingsReducer = (
  state: SettingsState = initialState,
  action: SettingsAction,
): SettingsState => {
  switch (action.type) {
    case 'SET_SEARCH_ENGINE':
      return {
        ...state,
        searchEngine: (action as SetSearchEngineAction).searchEngine,
      };
    case 'SET_LOCK_TIME':
      return {
        ...state,
        lockTime: (action as SetLockTimeAction).lockTime,
      };
    case 'SET_SHOW_HEX_DATA':
      return {
        ...state,
        showHexData: (action as SetShowHexDataAction).showHexData,
      };
    case 'SET_SHOW_CUSTOM_NONCE':
      return {
        ...state,
        showCustomNonce: (action as SetShowCustomNonceAction).showCustomNonce,
      };
    case 'SET_HIDE_ZERO_BALANCE_TOKENS':
      return {
        ...state,
        hideZeroBalanceTokens: (action as SetHideZeroBalanceTokensAction).hideZeroBalanceTokens,
      };
    case 'SET_USE_BLOCKIE_ICON':
      return {
        ...state,
        useBlockieIcon: (action as SetUseBlockieIconAction).useBlockieIcon,
      };
    case 'SET_PRIMARY_CURRENCY':
      return {
        ...state,
        primaryCurrency: (action as SetPrimaryCurrencyAction).primaryCurrency,
      };
    case 'SET_SHOW_FIAT_ON_TESTNETS':
      return {
        ...state,
        showFiatOnTestnets: (action as SetShowFiatOnTestnetsAction).showFiatOnTestnets,
      };
    case 'TOGGLE_BASIC_FUNCTIONALITY':
      return {
        ...state,
        basicFunctionalityEnabled: (action as ToggleBasicFunctionalityAction).basicFunctionalityEnabled,
      };

    case 'TOGGLE_DEVICE_NOTIFICATIONS':
      return {
        ...state,
        deviceNotificationEnabled: (action as ToggleDeviceNotificationsAction).deviceNotificationEnabled,
      };

    default:
      return state;
  }
};
export default settingsReducer;
