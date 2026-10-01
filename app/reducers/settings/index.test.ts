import settingsReducer from './index';
import AppConstants from '../../core/AppConstants';

describe('settingsReducer', () => {
  it('returns initial state', () => {
    expect(settingsReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual({
      searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
      primaryCurrency: 'ETH',
      lockTime: -1,
      useBlockieIcon: true,
      hideZeroBalanceTokens: false,
      basicFunctionalityEnabled: true,
    });
  });

  it('sets search engine', () => {
    const state = settingsReducer(undefined, {
      type: 'SET_SEARCH_ENGINE',
      searchEngine: 'Google',
    });
    expect(state.searchEngine).toBe('Google');
  });

  it('toggles basic functionality', () => {
    const state = settingsReducer(undefined, {
      type: 'TOGGLE_BASIC_FUNCTIONALITY',
      basicFunctionalityEnabled: false,
    });
    expect(state.basicFunctionalityEnabled).toBe(false);
  });
});
