import migrate from './001';
import AppConstants from '../../core/AppConstants';

describe('Migration #001', () => {
  it('renames the legacy DAI token to SAI', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              { symbol: 'DAI', address: AppConstants.SAI_ADDRESS.toUpperCase() },
              { symbol: 'DAI', address: '0x123' },
              { symbol: 'USDC', address: '0x456' },
            ],
          },
        },
      },
    };
    const { tokens } = migrate(state).engine.backgroundState.TokensController;
    expect(tokens.map((token) => token.symbol)).toEqual(['SAI', 'DAI', 'USDC']);
  });
});
