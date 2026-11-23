import migrate from './003';

describe('Migration #3', () => {
  // Characterizes existing behavior: `NetworksChainId` no longer exists in
  // @metamask/controller-utils, so this historical migration throws.
  it('throws because NetworksChainId is unavailable', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: { provider: { type: 'rpc', chainId: '1' } },
        },
      },
    };

    expect(() => migrate(oldState)).toThrow(TypeError);
  });
});
