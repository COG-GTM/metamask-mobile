import migrate from './009';

describe('Migration #9', () => {
  it('sets preference defaults while keeping existing preferences', () => {
    const oldState = {
      engine: {
        backgroundState: { PreferencesController: { foo: 'bar' } },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: { foo: 'bar', useStaticTokenList: true },
        },
      },
    });
  });
});
