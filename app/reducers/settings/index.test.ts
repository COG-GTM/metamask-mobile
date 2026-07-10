import settingsReducer, { SettingsState } from './index';
import AppConstants from '../../core/AppConstants';
import type { SettingsAction } from '../../actions/settings';

const emptyAction = { type: null } as unknown as SettingsAction;

describe('settingsReducer', () => {
  it('should return initial state', () => {
    const initialState: SettingsState = {
      searchEngine: AppConstants.DEFAULT_SEARCH_ENGINE,
      primaryCurrency: 'ETH',
      lockTime: -1,
      useBlockieIcon: true,
      hideZeroBalanceTokens: false,
      basicFunctionalityEnabled: true,
    };
    expect(settingsReducer(undefined, emptyAction)).toEqual(initialState);
  });
});
