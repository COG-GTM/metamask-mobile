import DefaultPreference from 'react-native-default-preference';
import migrate from './006';
import {
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  AGREED,
  DENIED,
  EXPLORED,
} from '../../constants/storage';

jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
}));

describe('Migration #006', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores metrics opt in when analytics is enabled', () => {
    const state = { analytics: { enabled: true } };
    expect(migrate(state)).toBe(state);
    expect(DefaultPreference.set).toHaveBeenCalledWith(METRICS_OPT_IN, AGREED);
    expect(DefaultPreference.set).toHaveBeenCalledWith(
      ONBOARDING_WIZARD,
      EXPLORED,
    );
  });

  it('stores metrics opt out when analytics is disabled', () => {
    migrate({});
    expect(DefaultPreference.set).toHaveBeenCalledWith(METRICS_OPT_IN, DENIED);
  });
});
