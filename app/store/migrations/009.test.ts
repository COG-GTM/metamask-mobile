import migrate from './009';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #9', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('enables useStaticTokenList in PreferencesController', () => {
    const state = {
      engine: {
        backgroundState: { PreferencesController: { other: 'kept' } },
      },
    };
    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: { other: 'kept', useStaticTokenList: true },
        },
      },
    });
  });

  it('captures an exception and returns state unchanged when shape is invalid', () => {
    const state = { engine: { backgroundState: {} } };
    expect(migrate(state)).toBe(state);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 9',
    );
  });
});
