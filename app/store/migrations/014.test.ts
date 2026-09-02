import migrate from './014';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #14', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 14',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 14',
    );
  });

  it('migrates state', () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { chainId: '1' },
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { chainId: '1' },
          },
        },
      },
    });
  });

  it('does not change state when there is no provider', () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: {},
        },
      },
    };

    expect(migrate(state)).toStrictEqual(state);
  });
});
