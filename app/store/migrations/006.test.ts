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

const mockSet = jest.mocked(DefaultPreference.set);

describe('Migration #6', () => {
  beforeEach(() => {
    mockSet.mockClear();
  });

  it('stores metrics opt-in when analytics is enabled', () => {
    const oldState = { analytics: { enabled: true } };

    expect(migrate(oldState)).toStrictEqual(oldState);
    expect(mockSet).toHaveBeenCalledWith(METRICS_OPT_IN, AGREED);
    expect(mockSet).toHaveBeenCalledWith(ONBOARDING_WIZARD, EXPLORED);
  });

  it('stores metrics opt-out when analytics is disabled', () => {
    migrate({});

    expect(mockSet).toHaveBeenCalledWith(METRICS_OPT_IN, DENIED);
    expect(mockSet).toHaveBeenCalledWith(ONBOARDING_WIZARD, EXPLORED);
  });
});
