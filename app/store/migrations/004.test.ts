import migrate from './004';

describe('Migration #4', () => {
  it('preserves controller state when there are no tokens or collectibles', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: { allTokens: {}, foo: 'bar' },
          CollectiblesController: {
            allCollectibles: {},
            allCollectibleContracts: {},
            baz: 'qux',
          },
          PreferencesController: { frequentRpcList: [] },
        },
      },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });

  // Characterizes existing behavior: `NetworksChainId` no longer exists in
  // @metamask/controller-utils, so keyed entries make this migration throw.
  it('throws when tokens are present because NetworksChainId is unavailable', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: { allTokens: { '0x1': { mainnet: [] } } },
          CollectiblesController: {
            allCollectibles: {},
            allCollectibleContracts: {},
          },
          PreferencesController: { frequentRpcList: [] },
        },
      },
    };

    expect(() => migrate(oldState)).toThrow(TypeError);
  });
});
