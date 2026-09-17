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

const mockedSet = jest.mocked(DefaultPreference.set);

describe('Migration #6', () => {
  beforeEach(() => {
    mockedSet.mockClear();
  });

  it('should set metrics opt-in to agreed when analytics is enabled', () => {
    const oldState = { analytics: { enabled: true } };

    const newState = migrate(oldState);

    expect(mockedSet).toHaveBeenCalledWith(METRICS_OPT_IN, AGREED);
    expect(mockedSet).toHaveBeenCalledWith(ONBOARDING_WIZARD, EXPLORED);
    expect(newState).toStrictEqual(oldState);
  });

  it('should set metrics opt-in to denied when analytics is disabled', () => {
    const oldState = { analytics: { enabled: false } };

    const newState = migrate(oldState);

    expect(mockedSet).toHaveBeenCalledWith(METRICS_OPT_IN, DENIED);
    expect(newState).toStrictEqual(oldState);
  });
});
