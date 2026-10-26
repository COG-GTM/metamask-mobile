import migrate from './032';
import migration29 from './029';
import migration30 from './030';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
jest.mock('./029', () => jest.fn((state) => ({ ...state, migrated29: true })));
jest.mock('./030', () => jest.fn((state) => ({ ...state, migrated30: true })));

const mockedCaptureException = jest.mocked(captureException);

describe('Migration #32', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      state: null,
      expected: {},
      errorMessage: "Migration 32: Invalid state: 'object'",
      scenario: 'state is invalid',
    },
    {
      state: { engine: null, other: 1 },
      expected: { other: 1 },
      errorMessage: "Migration 32: Invalid engine state: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: { engine: { backgroundState: null }, other: 1 },
      expected: { other: 1 },
      errorMessage: "Migration 32: Invalid engine backgroundState: 'object'",
      scenario: 'backgroundState is invalid',
    },
  ])(
    'captures exception and strips state if $scenario',
    async ({ state, expected, errorMessage }) => {
      const newState = await migrate(state);
      expect(newState).toStrictEqual(expected);
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    },
  );

  it('captures exception if NetworkController state is invalid', async () => {
    const state = { engine: { backgroundState: { NetworkController: 'x' } } };
    expect(await migrate(state)).toBe(state);
    expect(mockedCaptureException.mock.calls[0][0].message).toBe(
      "Migration 32: Invalid NetworkController state: 'string'",
    );
  });

  it('captures exception if providerConfig is invalid', async () => {
    const state = {
      engine: { backgroundState: { NetworkController: {} } },
    };
    expect(await migrate(state)).toBe(state);
    expect(mockedCaptureException.mock.calls[0][0].message).toBe(
      "Migration 32: Invalid NetworkController providerConfig: 'undefined'",
    );
  });

  it('returns state unchanged if providerConfig has an rpcUrl', async () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: { providerConfig: { rpcUrl: 'https://rpc' } },
        },
      },
    };
    expect(await migrate(Promise.resolve(state))).toBe(state);
    expect(migration29).not.toHaveBeenCalled();
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('re-runs migrations 29 and 30 when providerConfig has no rpcUrl', async () => {
    const state = {
      engine: {
        backgroundState: {
          NetworkController: { providerConfig: { type: 'mainnet' } },
        },
      },
    };
    expect(await migrate(state)).toStrictEqual({
      ...state,
      migrated29: true,
      migrated30: true,
    });
    expect(migration29).toHaveBeenCalledWith(state);
    expect(migration30).toHaveBeenCalled();
  });
});
