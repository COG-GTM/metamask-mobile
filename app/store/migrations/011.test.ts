import migrate from './011';

describe('Migration #11', () => {
  it('sets preference defaults while keeping existing preferences', () => {
    const oldState = {
      engine: {
        backgroundState: { PreferencesController: { foo: 'bar' } },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: { foo: 'bar', useTokenDetection: true },
        },
      },
    });
  });
});
