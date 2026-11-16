import reducer, {
  initialState,
  setSourceAmount,
  setDestAmount,
  resetBridgeState,
  setSlippage,
  BridgeState,
  selectAllBridgeableNetworks,
  selectBridgeFeatureFlags,
  selectEnabledSourceChains,
  selectEnabledDestChains,
  selectIsBridgeEnabledSource,
  selectIsBridgeEnabledDest,
  selectTopAssetsFromFeatureFlags,
  selectSelectedSourceChainIds,
  selectSelectedDestChainId,
  selectIsEvmToSolana,
  selectIsSolanaToEvm,
  selectIsSolanaSwap,
  selectIsEvmSolanaBridge,
} from '.';
import { BridgeToken } from '../../../../components/UI/Bridge/types';
import { CaipChainId, Hex } from '@metamask/utils';
import { SolScope } from '@metamask/keyring-api';
import { RootState } from '../../../../reducers';
import initialRootState, {
  backgroundState,
} from '../../../../util/test/initial-root-state';
import { PopularList } from '../../../../util/networks/customNetworks';

describe('bridge slice', () => {
  const mockToken: BridgeToken = {
    address: '0x123',
    symbol: 'ETH',
    decimals: 18,
    image: 'https://example.com/eth.png',
    chainId: '0x1' as Hex,
    name: 'Ethereum',
    balance: '100',
    balanceFiat: '100',
  };

  const mockDestToken: BridgeToken = {
    address: '0x456',
    symbol: 'USDC',
    decimals: 6,
    image: 'https://example.com/usdc.png',
    chainId: '0x2' as Hex,
    name: 'USDC',
    balance: '100',
    balanceFiat: '100',
  };

  describe('initial state', () => {
    it('should have the correct initial state', () => {
      expect(initialState).toEqual({
        sourceAmount: undefined,
        destAmount: undefined,
        destChainId: undefined,
        sourceToken: undefined,
        destToken: undefined,
        slippage: '0.5',
        isSubmittingTx: false,
      });
    });
  });

  describe('setSourceAmount', () => {
    it('should set the source amount', () => {
      const amount = '1.5';
      const action = setSourceAmount(amount);
      const state = reducer(initialState, action);

      expect(state.sourceAmount).toBe(amount);
    });

    it('should set source amount to undefined', () => {
      const action = setSourceAmount(undefined);
      const state = reducer(initialState, action);

      expect(state.sourceAmount).toBeUndefined();
    });
  });

  describe('setSlippage', () => {
    it('should set the slippage', () => {
      const slippage = '0.5';
      const action = setSlippage(slippage);
      const state = reducer(initialState, action);

      expect(state.slippage).toBe(slippage);
    });
  });

  describe('setDestAmount', () => {
    it('should set the destination amount', () => {
      const amount = '100';
      const action = setDestAmount(amount);
      const state = reducer(initialState, action);

      expect(state.destAmount).toBe(amount);
    });

    it('should set dest amount to undefined', () => {
      const action = setDestAmount(undefined);
      const state = reducer(initialState, action);

      expect(state.destAmount).toBeUndefined();
    });
  });

  describe('resetBridgeState', () => {
    it('should reset the state to initial state', () => {
      const state = {
        ...initialState,
        sourceAmount: '1.5',
        destAmount: '100',
        sourceToken: mockToken,
        destToken: mockDestToken,
      };

      const action = resetBridgeState();
      const newState = reducer(state, action);

      expect(newState).toEqual(initialState);
    });
  });
  describe('selectors', () => {
    const ETH_MAINNET = '0x1' as Hex;
    const LINEA_MAINNET = '0xe708' as Hex;
    const OPTIMISM = '0xa' as Hex;
    const BASE = '0x2105' as Hex;
    const POLYGON = '0x89' as Hex;
    const SEPOLIA = '0xaa36a7' as Hex;
    const SOLANA_MAINNET = SolScope.Mainnet as CaipChainId;

    interface ChainFlags {
      isActiveSrc: boolean;
      isActiveDest: boolean;
      topAssets?: string[];
    }

    const buildBridgeConfig = (
      chains: Record<string, ChainFlags>,
      support = true,
    ) => ({
      refreshRate: 30000,
      maxRefreshCount: 5,
      support,
      chains,
    });

    const allChainsActive: Record<string, ChainFlags> = {
      '1': { isActiveSrc: true, isActiveDest: true, topAssets: ['0xabc'] },
      '59144': { isActiveSrc: true, isActiveDest: true },
      '10': { isActiveSrc: true, isActiveDest: true },
      '8453': { isActiveSrc: true, isActiveDest: true },
      [SOLANA_MAINNET]: {
        isActiveSrc: true,
        isActiveDest: true,
        topAssets: ['solAsset'],
      },
    };

    const userOptimismNetwork = {
      blockExplorerUrls: [],
      chainId: OPTIMISM,
      defaultRpcEndpointIndex: 0,
      name: 'My Optimism',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'my-optimism',
          type: 'custom',
          url: 'https://optimism.example.com',
          failoverUrls: [],
        },
      ],
    };

    const buildState = ({
      bridgeConfig,
      bridge = {},
      extraNetworks = {},
    }: {
      bridgeConfig?: unknown;
      bridge?: Partial<BridgeState>;
      extraNetworks?: Record<string, unknown>;
    } = {}): RootState =>
      ({
        ...initialRootState,
        engine: {
          backgroundState: {
            ...backgroundState,
            NetworkController: {
              ...backgroundState.NetworkController,
              networkConfigurationsByChainId: {
                ...backgroundState.NetworkController
                  .networkConfigurationsByChainId,
                ...extraNetworks,
              },
            },
            RemoteFeatureFlagController: {
              ...backgroundState.RemoteFeatureFlagController,
              remoteFeatureFlags:
                bridgeConfig === undefined ? {} : { bridgeConfig },
            },
          },
        },
        bridge: { ...initialState, ...bridge },
      } as unknown as RootState);

    const chainIdsOf = (networks: { chainId: string }[]) =>
      networks.map(({ chainId }) => chainId);

    const tokenOn = (chainId: Hex | CaipChainId): BridgeToken => ({
      ...mockToken,
      chainId,
    });

    describe('selectAllBridgeableNetworks', () => {
      it('keeps only user networks whose chain id is bridge-allowed', () => {
        const state = buildState({
          extraNetworks: { [OPTIMISM]: userOptimismNetwork },
        });

        const chainIds = chainIdsOf(selectAllBridgeableNetworks(state));

        expect(chainIds).toEqual(
          expect.arrayContaining([
            ETH_MAINNET,
            LINEA_MAINNET,
            OPTIMISM,
            SOLANA_MAINNET,
          ]),
        );
        expect(chainIds).not.toContain(SEPOLIA);
        expect(chainIds).not.toContain('0xe705');
        expect(chainIds).not.toContain(BASE);
        expect(new Set(chainIds).size).toBe(chainIds.length);
      });
    });

    describe('selectBridgeFeatureFlags', () => {
      it('normalizes chain keys to CAIP chain ids', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig(allChainsActive),
        });

        const flags = selectBridgeFeatureFlags(state);

        expect(flags.support).toBe(true);
        expect(Object.keys(flags.chains)).toEqual(
          expect.arrayContaining([
            'eip155:1',
            'eip155:59144',
            'eip155:10',
            'eip155:8453',
            SOLANA_MAINNET,
          ]),
        );
      });

      it('falls back to a disabled config when bridgeConfig is missing or invalid', () => {
        for (const bridgeConfig of [undefined, { support: 'yes' }]) {
          const flags = selectBridgeFeatureFlags(buildState({ bridgeConfig }));
          expect(flags.support).toBe(false);
          expect(flags.chains).toEqual({});
        }
      });
    });

    describe('selectEnabledSourceChains', () => {
      it('returns only user networks with isActiveSrc', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig({
            '1': { isActiveSrc: true, isActiveDest: false },
            '59144': { isActiveSrc: false, isActiveDest: true },
            [SOLANA_MAINNET]: { isActiveSrc: true, isActiveDest: false },
            // Active but not added by the user, so never a source
            '8453': { isActiveSrc: true, isActiveDest: true },
          }),
        });

        expect(chainIdsOf(selectEnabledSourceChains(state))).toEqual([
          ETH_MAINNET,
          SOLANA_MAINNET,
        ]);
      });

      it('returns no chains when the feature flag config is invalid', () => {
        const state = buildState({ bridgeConfig: { chains: 'bad' } });

        expect(selectEnabledSourceChains(state)).toEqual([]);
      });
    });

    describe('selectEnabledDestChains', () => {
      it('merges PopularList networks and filters on isActiveDest', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig({
            '1': { isActiveSrc: true, isActiveDest: false },
            '59144': { isActiveSrc: false, isActiveDest: true },
            '8453': { isActiveSrc: false, isActiveDest: true },
            '137': { isActiveSrc: true, isActiveDest: false },
            [SOLANA_MAINNET]: { isActiveSrc: false, isActiveDest: true },
          }),
        });

        const chainIds = chainIdsOf(selectEnabledDestChains(state));

        expect(chainIds).toEqual(
          expect.arrayContaining([LINEA_MAINNET, SOLANA_MAINNET, BASE]),
        );
        expect(chainIds).toHaveLength(3);
        expect(chainIds).not.toContain(ETH_MAINNET);
        expect(chainIds).not.toContain(POLYGON);
      });

      it('formats PopularList entries with nickname as name', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig({
            '8453': { isActiveSrc: false, isActiveDest: true },
          }),
        });
        const popularBase = PopularList.find(({ chainId }) => chainId === BASE);

        expect(selectEnabledDestChains(state)).toEqual([
          {
            chainId: BASE,
            name: popularBase?.nickname,
            rpcUrl: popularBase?.rpcUrl,
            ticker: popularBase?.ticker,
            rpcPrefs: popularBase?.rpcPrefs,
          },
        ]);
      });

      it('dedupes by chainId and prefers the user network over PopularList', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig(allChainsActive),
          extraNetworks: { [OPTIMISM]: userOptimismNetwork },
        });

        const destChains = selectEnabledDestChains(state);
        const optimismEntries = destChains.filter(
          ({ chainId }) => chainId === OPTIMISM,
        );
        const chainIds = chainIdsOf(destChains);

        expect(optimismEntries).toHaveLength(1);
        expect(optimismEntries[0].name).toBe('My Optimism');
        expect(new Set(chainIds).size).toBe(chainIds.length);
        expect(chainIds).toEqual(
          expect.arrayContaining([
            ETH_MAINNET,
            LINEA_MAINNET,
            OPTIMISM,
            BASE,
            SOLANA_MAINNET,
          ]),
        );
      });

      it('returns no chains when no chain is active as destination', () => {
        const state = buildState({
          bridgeConfig: buildBridgeConfig({
            '1': { isActiveSrc: true, isActiveDest: false },
            '8453': { isActiveSrc: true, isActiveDest: false },
          }),
        });

        expect(selectEnabledDestChains(state)).toEqual([]);
      });
    });

    describe.each([
      [
        'selectIsBridgeEnabledSource',
        selectIsBridgeEnabledSource,
        'isActiveSrc',
      ],
      ['selectIsBridgeEnabledDest', selectIsBridgeEnabledDest, 'isActiveDest'],
    ] as const)('%s', (_name, selector, flag) => {
      const otherFlag = flag === 'isActiveSrc' ? 'isActiveDest' : 'isActiveSrc';
      const chains = {
        '1': { [flag]: true, [otherFlag]: false } as unknown as ChainFlags,
        '59144': { [flag]: false, [otherFlag]: true } as unknown as ChainFlags,
        [SOLANA_MAINNET]: {
          [flag]: true,
          [otherFlag]: false,
        } as unknown as ChainFlags,
      };

      it.each([
        ['hex', ETH_MAINNET],
        ['CAIP', 'eip155:1' as CaipChainId],
        ['Solana CAIP', SOLANA_MAINNET],
      ])('is true for an active chain given a %s chain id', (_f, chainId) => {
        const state = buildState({ bridgeConfig: buildBridgeConfig(chains) });

        expect(selector(state, chainId)).toBe(true);
      });

      it.each([
        ['inactive hex', LINEA_MAINNET],
        ['inactive CAIP', 'eip155:59144' as CaipChainId],
        ['unconfigured hex', POLYGON],
        ['unconfigured CAIP', 'eip155:137' as CaipChainId],
      ])('is falsy for an %s chain id', (_f, chainId) => {
        const state = buildState({ bridgeConfig: buildBridgeConfig(chains) });

        expect(selector(state, chainId)).toBeFalsy();
      });

      it.each([
        ['hex', ETH_MAINNET],
        ['CAIP', 'eip155:1' as CaipChainId],
      ])(
        'is false for an active %s chain when support is false',
        (_f, chainId) => {
          const state = buildState({
            bridgeConfig: buildBridgeConfig(chains, false),
          });

          expect(selector(state, chainId)).toBe(false);
        },
      );
    });

    describe('selectTopAssetsFromFeatureFlags', () => {
      const state = buildState({
        bridgeConfig: buildBridgeConfig(allChainsActive),
      });

      it('returns undefined when chainId is undefined', () => {
        expect(
          selectTopAssetsFromFeatureFlags(state, undefined),
        ).toBeUndefined();
      });

      it.each([
        ['hex', ETH_MAINNET, ['0xabc']],
        ['CAIP', 'eip155:1' as CaipChainId, ['0xabc']],
        ['Solana', SOLANA_MAINNET, ['solAsset']],
      ])('returns topAssets for a %s chain id', (_f, chainId, expected) => {
        expect(selectTopAssetsFromFeatureFlags(state, chainId)).toEqual(
          expected,
        );
      });

      it('returns undefined for a chain without topAssets or config', () => {
        expect(
          selectTopAssetsFromFeatureFlags(state, LINEA_MAINNET),
        ).toBeUndefined();
        expect(selectTopAssetsFromFeatureFlags(state, POLYGON)).toBeUndefined();
      });
    });

    describe('selectSelectedSourceChainIds', () => {
      const bridgeConfig = buildBridgeConfig({
        '1': { isActiveSrc: true, isActiveDest: true },
        '59144': { isActiveSrc: false, isActiveDest: true },
        [SOLANA_MAINNET]: { isActiveSrc: true, isActiveDest: true },
      });

      it('defaults to all enabled source chains when unset', () => {
        const state = buildState({ bridgeConfig });

        expect(selectSelectedSourceChainIds(state)).toEqual([
          ETH_MAINNET,
          SOLANA_MAINNET,
        ]);
      });

      it('returns the explicit selection when set', () => {
        const state = buildState({
          bridgeConfig,
          bridge: { selectedSourceChainIds: [LINEA_MAINNET] },
        });

        expect(selectSelectedSourceChainIds(state)).toEqual([LINEA_MAINNET]);
      });

      it('keeps an explicit empty selection instead of defaulting', () => {
        const state = buildState({
          bridgeConfig,
          bridge: { selectedSourceChainIds: [] },
        });

        expect(selectSelectedSourceChainIds(state)).toEqual([]);
      });
    });

    describe('selectSelectedDestChainId', () => {
      it('defaults to the source token chain when unset', () => {
        const state = buildState({
          bridge: { sourceToken: tokenOn(LINEA_MAINNET) },
        });

        expect(selectSelectedDestChainId(state)).toBe(LINEA_MAINNET);
      });

      it('is undefined when unset and there is no source token', () => {
        expect(selectSelectedDestChainId(buildState())).toBeUndefined();
      });

      it('returns the explicit selection over the source token chain', () => {
        const state = buildState({
          bridge: {
            sourceToken: tokenOn(ETH_MAINNET),
            selectedDestChainId: SOLANA_MAINNET,
          },
        });

        expect(selectSelectedDestChainId(state)).toBe(SOLANA_MAINNET);
      });
    });

    describe('EVM / Solana route classification', () => {
      const EVM = ETH_MAINNET;
      const EVM_CAIP = 'eip155:1' as CaipChainId;
      const SOL = SOLANA_MAINNET;

      it.each([
        // source, dest, evmToSolana, solanaToEvm, solanaSwap
        ['EVM', EVM, 'EVM', LINEA_MAINNET, false, false, false],
        ['EVM', EVM, 'Solana', SOL, true, false, false],
        ['EVM (CAIP)', EVM_CAIP, 'Solana', SOL, true, false, false],
        ['Solana', SOL, 'EVM', EVM, false, true, false],
        ['Solana', SOL, 'EVM (CAIP)', EVM_CAIP, false, true, false],
        ['Solana', SOL, 'Solana', SOL, false, false, true],
        ['EVM (CAIP)', EVM_CAIP, 'EVM', LINEA_MAINNET, false, false, false],
      ] as const)(
        '%s source (%s) -> %s dest (%s)',
        (_s, srcChainId, _d, destChainId, evmToSol, solToEvm, solSwap) => {
          const state = buildState({
            bridge: {
              sourceToken: tokenOn(srcChainId),
              destToken: tokenOn(destChainId),
            },
          });

          expect(Boolean(selectIsEvmToSolana(state))).toBe(evmToSol);
          expect(Boolean(selectIsSolanaToEvm(state))).toBe(solToEvm);
          expect(Boolean(selectIsSolanaSwap(state))).toBe(solSwap);
          expect(Boolean(selectIsEvmSolanaBridge(state))).toBe(
            evmToSol || solToEvm,
          );
        },
      );

      it.each([
        ['no tokens', undefined, undefined],
        ['only an EVM source token', EVM, undefined],
        ['only a Solana source token', SOL, undefined],
        ['only an EVM dest token', undefined, EVM],
        ['only a Solana dest token', undefined, SOL],
      ] as const)('is falsy for every route with %s', (_c, src, dest) => {
        const state = buildState({
          bridge: {
            sourceToken: src ? tokenOn(src) : undefined,
            destToken: dest ? tokenOn(dest) : undefined,
          },
        });

        expect(selectIsEvmToSolana(state)).toBeFalsy();
        expect(selectIsSolanaToEvm(state)).toBeFalsy();
        expect(selectIsSolanaSwap(state)).toBeFalsy();
        expect(selectIsEvmSolanaBridge(state)).toBeFalsy();
      });
    });
  });
});
