import AppConstants from '../../core/AppConstants';

export const SET_SEARCH_ENGINE = 'SET_SEARCH_ENGINE';
export const SET_LOCK_TIME = 'SET_LOCK_TIME';
export const SET_SHOW_HEX_DATA = 'SET_SHOW_HEX_DATA';
export const SET_SHOW_CUSTOM_NONCE = 'SET_SHOW_CUSTOM_NONCE';
export const SET_HIDE_ZERO_BALANCE_TOKENS = 'SET_HIDE_ZERO_BALANCE_TOKENS';
export const SET_USE_BLOCKIE_ICON = 'SET_USE_BLOCKIE_ICON';
export const SET_PRIMARY_CURRENCY = 'SET_PRIMARY_CURRENCY';
export const SET_SHOW_FIAT_ON_TESTNETS = 'SET_SHOW_FIAT_ON_TESTNETS';
export const TOGGLE_BASIC_FUNCTIONALITY = 'TOGGLE_BASIC_FUNCTIONALITY';
export const TOGGLE_DEVICE_NOTIFICATIONS = 'TOGGLE_DEVICE_NOTIFICATIONS';

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

interface SetSearchEngineAction {
  type: typeof SET_SEARCH_ENGINE;
  searchEngine: string;
}

interface SetLockTimeAction {
  type: typeof SET_LOCK_TIME;
  lockTime: number;
}

interface SetShowHexDataAction {
  type: typeof SET_SHOW_HEX_DATA;
  showHexData: boolean;
}

interface SetShowCustomNonceAction {
  type: typeof SET_SHOW_CUSTOM_NONCE;
  showCustomNonce: boolean;
}

interface SetHideZeroBalanceTokensAction {
  type: typeof SET_HIDE_ZERO_BALANCE_TOKENS;
  hideZeroBalanceTokens: boolean;
}

interface SetUseBlockieIconAction {
  type: typeof SET_USE_BLOCKIE_ICON;
  useBlockieIcon: boolean;
}

interface SetPrimaryCurrencyAction {
  type: typeof SET_PRIMARY_CURRENCY;
  primaryCurrency: string;
}

interface SetShowFiatOnTestnetsAction {
  type: typeof SET_SHOW_FIAT_ON_TESTNETS;
  showFiatOnTestnets: boolean;
}

interface ToggleBasicFunctionalityAction {
  type: typeof TOGGLE_BASIC_FUNCTIONALITY;
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationsAction {
  type: typeof TOGGLE_DEVICE_NOTIFICATIONS;
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
  | ToggleDeviceNotificationsAction;

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
    case SET_SEARCH_ENGINE:
      return {
        ...state,
        searchEngine: action.searchEngine,
      };
    case SET_LOCK_TIME:
      return {
        ...state,
        lockTime: action.lockTime,
      };
    case SET_SHOW_HEX_DATA:
      return {
        ...state,
        showHexData: action.showHexData,
      };
    case SET_SHOW_CUSTOM_NONCE:
      return {
        ...state,
        showCustomNonce: action.showCustomNonce,
      };
    case SET_HIDE_ZERO_BALANCE_TOKENS:
      return {
        ...state,
        hideZeroBalanceTokens: action.hideZeroBalanceTokens,
      };
    case SET_USE_BLOCKIE_ICON:
      return {
        ...state,
        useBlockieIcon: action.useBlockieIcon,
      };
    case SET_PRIMARY_CURRENCY:
      return {
        ...state,
        primaryCurrency: action.primaryCurrency,
      };
    case SET_SHOW_FIAT_ON_TESTNETS:
      return {
        ...state,
        showFiatOnTestnets: action.showFiatOnTestnets,
      };
    case TOGGLE_BASIC_FUNCTIONALITY:
      return {
        ...state,
        basicFunctionalityEnabled: action.basicFunctionalityEnabled,
      };
    case TOGGLE_DEVICE_NOTIFICATIONS:
      return {
        ...state,
        deviceNotificationEnabled: action.deviceNotificationEnabled,
      };
    default:
      return state;
  }
};

export default settingsReducer;
