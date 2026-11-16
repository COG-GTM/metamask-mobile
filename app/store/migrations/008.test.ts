import migrate from './008';

const createState = (TokensController: Record<string, unknown>) => ({
  engine: {
    backgroundState: {
      TokensController,
      PreferencesController: { selectedAddress: '0xAccount1' },
    },
  },
  settings: { searchEngine: 'DuckDuckGo' },
});

describe('Migration #8', () => {
  it('normalizes flat ignoredTokens to addresses, dropping empty entries', () => {
    const state = createState({
      ignoredTokens: [
        '0xString1',
        { address: '0xObject1', symbol: 'ABC', decimals: 18 },
        {},
        '',
        null,
        { address: '' },
        { symbol: 'NOADDR' },
        '0xString2',
      ],
    });

    const newState = migrate(state);

    expect(
      newState.engine.backgroundState.TokensController.ignoredTokens,
    ).toEqual(['0xString1', '0xObject1', '0xString2']);
  });

  it('normalizes allIgnoredTokens for every chain and account', () => {
    const state = createState({
      allIgnoredTokens: {
        '0x1': {
          '0xAccount1': ['0xA', { address: '0xB' }, {}, ''],
          '0xAccount2': [{ address: '0xC', symbol: 'C' }, null],
        },
        '0x5': {
          '0xAccount1': ['', { address: '' }],
          '0xAccount3': ['0xD'],
        },
      },
    });

    const newState = migrate(state);

    expect(
      newState.engine.backgroundState.TokensController.allIgnoredTokens,
    ).toEqual({
      '0x1': {
        '0xAccount1': ['0xA', '0xB'],
        '0xAccount2': ['0xC'],
      },
      '0x5': {
        '0xAccount1': [],
        '0xAccount3': ['0xD'],
      },
    });
  });

  it('normalizes both lists together and preserves other state', () => {
    const tokens = [{ address: '0xToken', symbol: 'TKN', decimals: 18 }];
    const state = createState({
      tokens,
      ignoredTokens: [{ address: '0xFlat' }, '0xFlat2'],
      allIgnoredTokens: {
        '0x1': { '0xAccount1': [{ address: '0xNested' }, '0xNested2'] },
      },
    });

    const newState = migrate(state);

    expect(newState).toBe(state);
    expect(newState).toEqual({
      engine: {
        backgroundState: {
          TokensController: {
            tokens,
            ignoredTokens: ['0xFlat', '0xFlat2'],
            allIgnoredTokens: {
              '0x1': { '0xAccount1': ['0xNested', '0xNested2'] },
            },
          },
          PreferencesController: { selectedAddress: '0xAccount1' },
        },
      },
      settings: { searchEngine: 'DuckDuckGo' },
    });
  });

  it('defaults both lists to empty when they are missing', () => {
    const state = createState({ tokens: [] });

    const newState = migrate(state);

    expect(newState.engine.backgroundState.TokensController).toEqual({
      tokens: [],
      allIgnoredTokens: {},
      ignoredTokens: [],
    });
  });

  it('keeps already-normalized lists unchanged', () => {
    const state = createState({
      ignoredTokens: ['0xA', '0xB'],
      allIgnoredTokens: { '0x1': { '0xAccount1': ['0xC'] } },
    });

    const newState = migrate(state);

    expect(newState.engine.backgroundState.TokensController).toEqual({
      ignoredTokens: ['0xA', '0xB'],
      allIgnoredTokens: { '0x1': { '0xAccount1': ['0xC'] } },
    });
  });
});
