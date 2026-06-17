import migrate from './002';

describe('Migration #2', () => {
  // This migration relies on `isSafeChainId`, which is not exported by
  // `../../util/networks`, so the migration throws when executed. The test
  // documents that preserved (pre-existing) behavior.
  it('should throw because isSafeChainId is unavailable', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {},
          },
        },
      },
    };

    expect(() => migrate(oldState)).toThrow();
  });
});
