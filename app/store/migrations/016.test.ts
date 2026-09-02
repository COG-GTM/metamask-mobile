import migrate from './016';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #16', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 16',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 16',
    );
  });

  it('migrates state', () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: {
            properties: {
              isEIP1559Compatible: true,
            },
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            networkDetails: {
              isEIP1559Compatible: true,
            },
          },
        },
      },
    });
  });
});
