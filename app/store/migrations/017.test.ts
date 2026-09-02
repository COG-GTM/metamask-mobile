import migrate from './017';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #17', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 17',
    );
  });

  it('migrates state', () => {
    const state = {
      networkOnboarded: {
        networkOnboardedState: {
          '1': true,
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      networkOnboarded: {
        networkOnboardedState: {},
      },
    });
  });
});
