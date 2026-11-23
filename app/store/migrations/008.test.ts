import migrate from './008';

describe('Migration #8', () => {
  it('normalizes ignored tokens to address strings', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            foo: 'bar',
            ignoredTokens: ['0x1', { address: '0x2' }, null, {}],
            allIgnoredTokens: {
              1: { '0xA': ['0x3', { address: '0x4' }, undefined] },
            },
          },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: {
            foo: 'bar',
            ignoredTokens: ['0x1', '0x2'],
            allIgnoredTokens: { 1: { '0xA': ['0x3', '0x4'] } },
          },
        },
      },
    });
  });

  it('defaults missing ignored tokens to empty values', () => {
    const oldState = {
      engine: { backgroundState: { TokensController: {} } },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          TokensController: { allIgnoredTokens: {}, ignoredTokens: [] },
        },
      },
    });
  });
});
