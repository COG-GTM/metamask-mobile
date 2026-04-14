import migrate from './006';

jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
}));

jest.mock('../../constants/storage', () => ({
  ONBOARDING_WIZARD: 'onboarding_wizard',
  METRICS_OPT_IN: 'metrics_opt_in',
  AGREED: 'agreed',
  DENIED: 'denied',
  EXPLORED: 'explored',
}));

describe('Migration #06', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set AGREED when analytics is enabled', () => {
    const DefaultPreference = require('react-native-default-preference');
    const oldState = {
      analytics: { enabled: true },
    };

    const newState = migrate(oldState);

    expect(DefaultPreference.set).toHaveBeenCalledWith('metrics_opt_in', 'agreed');
    expect(DefaultPreference.set).toHaveBeenCalledWith('onboarding_wizard', 'explored');
    expect(newState).toStrictEqual(oldState);
  });

  it('should set DENIED when analytics is disabled', () => {
    const DefaultPreference = require('react-native-default-preference');
    const oldState = {
      analytics: { enabled: false },
    };

    const newState = migrate(oldState);

    expect(DefaultPreference.set).toHaveBeenCalledWith('metrics_opt_in', 'denied');
    expect(newState).toStrictEqual(oldState);
  });

  it('should set DENIED when analytics is missing', () => {
    const DefaultPreference = require('react-native-default-preference');
    const oldState = {};

    const newState = migrate(oldState);

    expect(DefaultPreference.set).toHaveBeenCalledWith('metrics_opt_in', 'denied');
    expect(newState).toStrictEqual(oldState);
  });
});
