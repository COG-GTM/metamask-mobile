import DefaultPreference from 'react-native-default-preference';
import migrate from './006';
import {
  AGREED,
  DENIED,
  EXPLORED,
  METRICS_OPT_IN,
  ONBOARDING_WIZARD,
} from '../../constants/storage';

jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
}));
const mockedSet = jest.mocked(DefaultPreference.set);

describe('Migration #6', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('persists AGREED when analytics is enabled', () => {
    const state = { analytics: { enabled: true } };
    expect(migrate(state)).toBe(state);
    expect(mockedSet).toHaveBeenCalledWith(METRICS_OPT_IN, AGREED);
    expect(mockedSet).toHaveBeenCalledWith(ONBOARDING_WIZARD, EXPLORED);
  });

  it('persists DENIED when analytics is disabled or missing', () => {
    const state = {};
    expect(migrate(state)).toBe(state);
    expect(mockedSet).toHaveBeenCalledWith(METRICS_OPT_IN, DENIED);
    expect(mockedSet).toHaveBeenCalledWith(ONBOARDING_WIZARD, EXPLORED);
  });
});
