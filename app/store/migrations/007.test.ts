import migrate from './007';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #7', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('re-keys allTokens by chainId and builds allIgnoredTokens', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xacc1': { '1': ['t1'], '5': ['t2'] },
              '0xacc2': { '1': ['t3'] },
            },
            ignoredTokens: ['0xignored'],
          },
        },
      },
    };

    const newState = migrate(state);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '1': { '0xacc1': ['t1'], '0xacc2': ['t3'] },
              '5': { '0xacc1': ['t2'] },
            },
            allIgnoredTokens: {
              '1': { '0xacc1': ['0xignored'], '0xacc2': ['0xignored'] },
              '5': { '0xacc1': ['0xignored'] },
            },
          },
        },
      },
    });
  });

  it('captures an exception and returns state unchanged when shape is invalid', () => {
    const state = { engine: { backgroundState: { TokensController: {} } } };
    expect(migrate(state)).toBe(state);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 7',
    );
  });
});
