import migrate from './010';

describe('Migration #10', () => {
  it('sets preference defaults while keeping existing preferences', () => {
    const oldState = {
      engine: {
        backgroundState: { PreferencesController: { foo: 'bar' } },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: {
            foo: 'bar',
            useCollectibleDetection: false,
            openSeaEnabled: false,
          },
        },
      },
    });
  });
});
