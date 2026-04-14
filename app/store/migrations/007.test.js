import migrate from './007';

describe('Migration #07', () => {
  it('should re-key allTokens from address->chainId to chainId->address', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xAccount1': {
                '1': [{ symbol: 'DAI' }],
                '5': [{ symbol: 'GOR' }],
              },
            },
            ignoredTokens: ['0xIgnored'],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({
      '1': { '0xAccount1': [{ symbol: 'DAI' }] },
      '5': { '0xAccount1': [{ symbol: 'GOR' }] },
    });
  });

  it('should handle empty allTokens', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
            ignoredTokens: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({});
  });

  it('should handle multiple accounts', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xAccount1': {
                '1': [{ symbol: 'DAI' }],
              },
              '0xAccount2': {
                '1': [{ symbol: 'USDC' }],
              },
            },
            ignoredTokens: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens['1']).toStrictEqual({
      '0xAccount1': [{ symbol: 'DAI' }],
      '0xAccount2': [{ symbol: 'USDC' }],
    });
  });
});
