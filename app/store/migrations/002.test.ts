import migrate from './002';

describe('Migration #2', () => {
  // Characterizes existing behavior: `isSafeChainId` is not exported from
  // util/networks, so this historical migration throws when invoked.
  it('throws because isSafeChainId is unavailable', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: { provider: { type: 'mainnet', chainId: '1' } },
        },
      },
    };

    expect(() => migrate(oldState)).toThrow(TypeError);
  });
});
