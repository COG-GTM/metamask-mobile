import migrate from './001';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #1', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renames DAI token at the SAI address to SAI', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                symbol: 'DAI',
              },
              {
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                symbol: 'DAI',
              },
              { address: '0x1', symbol: 'USDC' },
            ],
          },
        },
      },
    };

    const newState = migrate(state);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                symbol: 'SAI',
              },
              {
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                symbol: 'DAI',
              },
              { address: '0x1', symbol: 'USDC' },
            ],
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
      'Migration 1',
    );
  });
});
