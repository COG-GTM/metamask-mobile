import migrate from './008';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #8', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('normalizes ignored tokens to address strings', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            other: 'kept',
            ignoredTokens: ['0x1', { address: '0x2' }, {}, null],
            allIgnoredTokens: {
              '1': {
                '0xacc1': [{ address: '0x3' }, '0x4'],
                '0xacc2': [''],
              },
            },
          },
        },
      },
    };

    const newState = migrate(state);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            other: 'kept',
            ignoredTokens: ['0x1', '0x2'],
            allIgnoredTokens: {
              '1': { '0xacc1': ['0x3', '0x4'], '0xacc2': [] },
            },
          },
        },
      },
    });
  });

  it('defaults missing ignored token collections to empty', () => {
    const state = {
      engine: { backgroundState: { TokensController: {} } },
    };
    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: { ignoredTokens: [], allIgnoredTokens: {} },
        },
      },
    });
  });

  it('captures an exception and returns state unchanged when shape is invalid', () => {
    const state = { engine: { backgroundState: {} } };
    expect(migrate(state)).toBe(state);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 8',
    );
  });
});
