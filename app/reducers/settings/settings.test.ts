import settingsReducer from './index';
import AppConstants from '../../core/AppConstants';
import {
  setSearchEngine,
  setShowHexData,
  setShowCustomNonce,
  setShowFiatOnTestnets,
  setHideZeroBalanceTokens,
  setLockTime,
  setPrimaryCurrency,
  setUseBlockieIcon,
  toggleBasicFunctionality,
  toggleDeviceNotification,
  setTokenSortConfig,
} from '../../actions/settings';

const initialState = settingsReducer(undefined, { type: 'UNKNOWN' });

describe('settingsReducer', () => {
  it('returns the initial state', () => {
    expect(initialState).toEqual({
      searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
      primaryCurrency: 'ETH',
      lockTime: -1,
      useBlockieIcon: true,
      hideZeroBalanceTokens: false,
      basicFunctionalityEnabled: true,
    });
  });

  it.each([
    [setSearchEngine('Google'), 'searchEngine', 'Google'],
    [setLockTime(30000), 'lockTime', 30000],
    [setShowHexData(true), 'showHexData', true],
    [setShowCustomNonce(true), 'showCustomNonce', true],
    [setHideZeroBalanceTokens(true), 'hideZeroBalanceTokens', true],
    [setUseBlockieIcon(false), 'useBlockieIcon', false],
    [setPrimaryCurrency('Fiat'), 'primaryCurrency', 'Fiat'],
    [setShowFiatOnTestnets(true), 'showFiatOnTestnets', true],
    [toggleBasicFunctionality(false), 'basicFunctionalityEnabled', false],
    [toggleDeviceNotification(true), 'deviceNotificationEnabled', true],
  ])('handles %o', (action, key, value) => {
    const state = settingsReducer(initialState, action);
    expect((state as Record<string, unknown>)[key]).toBe(value);
    expect(state).not.toBe(initialState);
  });

  it('ignores unhandled actions', () => {
    const state = settingsReducer(initialState, setTokenSortConfig({}));
    expect(state).toBe(initialState);
  });
});

describe('settings actions', () => {
  it('creates the token sort config action', () => {
    expect(setTokenSortConfig({ key: 'name' })).toEqual({
      type: 'SET_TOKEN_SORT_CONFIG',
      tokenSortConfig: { key: 'name' },
    });
  });
});
