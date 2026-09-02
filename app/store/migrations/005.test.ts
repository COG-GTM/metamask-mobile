import migrate from './005';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #5', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('splits AssetsController into TokensController and CollectiblesController', () => {
    const state = {
      engine: {
        backgroundState: {
          AssetsController: {
            allTokens: { a: 1 },
            ignoredTokens: ['0x1'],
            allCollectibles: { b: 2 },
            allCollectibleContracts: { c: 3 },
            ignoredCollectibles: ['0x2'],
          },
        },
      },
    };

    const newState = migrate(state);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: { allTokens: { a: 1 }, ignoredTokens: ['0x1'] },
          CollectiblesController: {
            allCollectibles: { b: 2 },
            allCollectibleContracts: { c: 3 },
            ignoredCollectibles: ['0x2'],
          },
        },
      },
    });
  });

  it('captures an exception and returns state unchanged when shape is invalid', () => {
    const state = { engine: { backgroundState: {} } };
    expect(migrate(state)).toBe(state);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 5',
    );
  });
});
