import migrate from './001';
import AppConstants from '../../core/AppConstants';

jest.mock('../../core/AppConstants', () => ({
  SAI_ADDRESS: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
}));

jest.mock('../../util/general', () => ({
  toLowerCaseEquals: (a, b) =>
    a?.toLowerCase() === b?.toLowerCase(),
}));

describe('Migration #01', () => {
  it('should rename DAI to SAI when address matches SAI_ADDRESS', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                symbol: 'DAI',
                address: AppConstants.SAI_ADDRESS,
                decimals: 18,
              },
            ],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.tokens[0].symbol).toBe('SAI');
  });

  it('should not rename DAI if address does not match SAI_ADDRESS', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                symbol: 'DAI',
                address: '0xOtherAddress',
                decimals: 18,
              },
            ],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.tokens[0].symbol).toBe('DAI');
  });

  it('should not modify other tokens', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              { symbol: 'USDC', address: '0xUSDC', decimals: 6 },
            ],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.tokens[0].symbol).toBe('USDC');
  });

  it('should handle empty tokens array', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.tokens).toStrictEqual([]);
  });
});
