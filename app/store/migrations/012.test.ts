import migrate from './012';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #12', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception and returns state unchanged for invalid root state', () => {
    const state = null;
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 12',
    );
  });

  it('captures exception and returns state unchanged for invalid engine state', () => {
    const state = { engine: null };
    expect(migrate(state)).toStrictEqual(state);
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 12',
    );
  });

  it('migrates state', () => {
    const state = {
      engine: {
        backgroundState: {
          CollectiblesController: {
            allCollectibles: { a: 1 },
            allCollectibleContracts: { b: 2 },
            ignoredCollectibles: [3],
            extra: 'x',
          },
          CollectibleDetectionController: { d: 4 },
          PreferencesController: {
            useCollectibleDetection: true,
          },
        },
      },
    };

    expect(migrate(state)).toStrictEqual({
      engine: {
        backgroundState: {
          NftController: {
            extra: 'x',
            allNfts: { a: 1 },
            allNftContracts: { b: 2 },
            ignoredNfts: [3],
          },
          NftDetectionController: { d: 4 },
          PreferencesController: {
            useNftDetection: true,
          },
        },
      },
    });
  });
});
