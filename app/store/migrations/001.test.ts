import migrate from './001';
import AppConstants from '../../core/AppConstants';

describe('Migration #1', () => {
  it('should rename DAI token at the SAI address to SAI', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              { symbol: 'DAI', address: AppConstants.SAI_ADDRESS },
              { symbol: 'DAI', address: '0xother' },
            ],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.TokensController.tokens,
    ).toStrictEqual([
      { symbol: 'SAI', address: AppConstants.SAI_ADDRESS },
      { symbol: 'DAI', address: '0xother' },
    ]);
  });
});
