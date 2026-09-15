import reducer, { initialState } from './index';
import {
  setPrimaryCurrency,
  type SettingsAction,
} from '../../actions/settings';

describe('settingsReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as SettingsAction),
    ).toEqual(initialState);
  });

  it('sets the primary currency', () => {
    expect(reducer(undefined, setPrimaryCurrency('USD'))).toEqual({
      ...initialState,
      primaryCurrency: 'USD',
    });
  });
});
