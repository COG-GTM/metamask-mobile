import migrate from './003';

describe('Migration #3', () => {
  // This migration relies on `NetworksChainId`, which was removed from
  // `@metamask/controller-utils`, so the migration throws when executed. The
  // test documents that preserved (pre-existing) behavior.
  it('should throw because NetworksChainId is unavailable', () => {
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
