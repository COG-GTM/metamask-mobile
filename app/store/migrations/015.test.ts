import migrate from './015';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #15', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 15',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 15',
    );
  });

  it('migrates state', () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '4',
              type: 'rinkeby',
            },
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '5',
              ticker: 'GoerliETH',
              type: 'goerli',
            },
          },
        },
      },
    });
  });

  it('does not change state for a supported chain', () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '1',
            },
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual(state);
  });
});
