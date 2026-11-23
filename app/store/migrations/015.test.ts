import migrate from './015';

describe('Migration #15', () => {
  it('does not change a supported network', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: { providerConfig: { chainId: '1' } },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });

  // Characterizes existing behavior: `NetworksChainId` no longer exists in
  // @metamask/controller-utils, so the deprecated-network fallback throws.
  it('throws for deprecated networks because NetworksChainId is unavailable', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: { providerConfig: { chainId: '4' } },
        },
      },
    };

    expect(() => migrate(oldState)).toThrow(TypeError);
  });
});
