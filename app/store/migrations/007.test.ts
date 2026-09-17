import migrate from './007';

describe('Migration #7', () => {
  it('should flatten tokens from per-account per-chain to per-chain per-account', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xaccount1': { '1': [{ address: '0xtoken1' }] },
              '0xaccount2': { '1': [{ address: '0xtoken2' }] },
            },
            ignoredTokens: ['0xignored'],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController).toStrictEqual({
      allTokens: {
        '1': {
          '0xaccount1': [{ address: '0xtoken1' }],
          '0xaccount2': [{ address: '0xtoken2' }],
        },
      },
      allIgnoredTokens: {
        '1': {
          '0xaccount1': ['0xignored'],
          '0xaccount2': ['0xignored'],
        },
      },
    });
  });
});
