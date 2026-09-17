import migrate from './008';

describe('Migration #8', () => {
  it('should normalize ignored tokens to address strings', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allIgnoredTokens: {
              '1': {
                '0xaccount1': ['0xstring', { address: '0xobject' }, null],
              },
            },
            ignoredTokens: [{ address: '0xtoken1' }, '0xtoken2', undefined],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.TokensController.ignoredTokens,
    ).toStrictEqual(['0xtoken1', '0xtoken2']);
    expect(
      newState.engine.backgroundState.TokensController.allIgnoredTokens,
    ).toStrictEqual({
      '1': { '0xaccount1': ['0xstring', '0xobject'] },
    });
  });
});
