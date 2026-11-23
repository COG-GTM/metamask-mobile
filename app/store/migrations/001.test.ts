import migrate from './001';
import AppConstants from '../../core/AppConstants';

describe('Migration #1', () => {
  it('renames the legacy DAI token to SAI', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                address: AppConstants.SAI_ADDRESS.toLowerCase(),
                symbol: 'DAI',
              },
              { address: '0x1', symbol: 'DAI' },
            ],
          },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            tokens: [
              {
                address: AppConstants.SAI_ADDRESS.toLowerCase(),
                symbol: 'SAI',
              },
              { address: '0x1', symbol: 'DAI' },
            ],
          },
        },
      },
    });
  });
});
