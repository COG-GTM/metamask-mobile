import migrate from './010';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #10', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 10',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 10',
    );
  });

  it('migrates state', () => {
    const state = {
      engine: {
        backgroundState: {
          PreferencesController: { foo: 'bar' },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: {
            foo: 'bar',
            useCollectibleDetection: false,
            openSeaEnabled: false,
          },
        },
      },
    });
  });
});
