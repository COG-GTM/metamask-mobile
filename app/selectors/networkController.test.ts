import {
  selectNetworkControllerState,
  selectProviderConfig,
  selectEvmTicker,
  selectChainId,
  selectProviderType,
  selectNickname,
  selectRpcUrl,
  selectNetworkStatus,
  selectNetworkConfigurations,
  selectNetworkClientId,
  selectIsAllNetworks,
  selectNetworkConfigurationByChainId,
  selectNativeCurrencyByChainId,
  selectDefaultEndpointByChainId,
  selectRpcUrlByChainId,
  selectProviderTypeByChainId,
  selectIsEIP1559Network,
  selectAllPopularNetworkConfigurations,
  selectIsPopularNetwork,
  selectNativeNetworkCurrencies,
  createProviderConfig,
} from './networkController';
import { RootState } from '../reducers';
import { SolScope } from '@metamask/keyring-api';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';

describe('networkSelectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'custom-network',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              nativeCurrency: 'ETH',
              name: 'Ethereum Mainnet',
              rpcEndpoints: [
                {
                  networkClientId: 'infura-mainnet',
                  type: 'infura',
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
              blockExplorerUrls: ['https://etherscan.io'],
            },
            '0x89': {
              chainId: '0x89',
              nativeCurrency: 'MATIC',
              name: 'Polygon',
              rpcEndpoints: [
                {
                  networkClientId: 'custom-network',
                  type: 'custom',
                  url: 'https://polygon-rpc.com',
                },
              ],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          },
          networksMetadata: {
            'custom-network': { status: 'active' },
          },
        },
        MultichainNetworkController: {
          isEvmSelected: true,
          selectedMultichainNetworkChainId: SolScope.Mainnet,

          multichainNetworkConfigurationsByChainId: {},
        },
      },
    },
  } as unknown as RootState;

  it('selectNetworkControllerState should return the network controller state', () => {
    expect(selectNetworkControllerState(mockState)).toEqual(
      mockState.engine.backgroundState.NetworkController,
    );
  });

  it('selectProviderConfig should return the provider config for the selected network', () => {
    expect(selectProviderConfig(mockState)).toEqual({
      chainId: '0x89',
      ticker: 'MATIC',
      rpcPrefs: { blockExplorerUrl: 'https://polygonscan.com' },
      type: 'rpc',
      id: 'custom-network',
      nickname: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
    });
  });

  it('selectEvmTicker should return the ticker of the provider config', () => {
    expect(selectEvmTicker(mockState)).toBe('MATIC');
  });

  it('selectChainId should return the chainId of the provider config', () => {
    expect(selectChainId(mockState)).toBe('0x89');
  });

  it('selectProviderType should return the type of the provider config', () => {
    expect(selectProviderType(mockState)).toBe('rpc');
  });

  it('selectNickname should return the nickname of the provider config', () => {
    expect(selectNickname(mockState)).toBe('Polygon');
  });

  it('selectRpcUrl should return the rpcUrl of the provider config', () => {
    expect(selectRpcUrl(mockState)).toBe('https://polygon-rpc.com');
  });

  it('selectNetworkStatus should return the network status for the selected network', () => {
    expect(selectNetworkStatus(mockState)).toBe('active');
  });

  it('selectNetworkConfigurations should return the network configurations by chainId', () => {
    expect(selectNetworkConfigurations(mockState)).toEqual(
      mockState.engine.backgroundState.NetworkController
        .networkConfigurationsByChainId,
    );
  });

  it('selectNetworkClientId should return the selected network client ID', () => {
    expect(selectNetworkClientId(mockState)).toBe('custom-network');
  });

  it('selectIsAllNetworks should return false if tokenNetworkFilter length is greater than 1', () => {
    expect(
      selectIsAllNetworks({
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            NetworkController: {
              ...mockState.engine.backgroundState.NetworkController,
            },
            PreferencesController: {
              ...mockState.engine.backgroundState.PreferencesController,
              tokenNetworkFilter: { '0x1': 'true' },
            },
          },
        },
      }),
    ).toBe(false);
  });

  it('selectNetworkConfigurationByChainId should return the network configuration for a given chainId', () => {
    expect(selectNetworkConfigurationByChainId(mockState, '0x89')).toEqual(
      mockState.engine.backgroundState.NetworkController
        .networkConfigurationsByChainId['0x89'],
    );
  });

  it('selectNativeCurrencyByChainId should return the native currency for a given chainId', () => {
    expect(selectNativeCurrencyByChainId(mockState, '0x1')).toBe('ETH');
  });

  it('should return the default provider config if no matching network is found', () => {
    const noMatchState = { ...mockState };
    noMatchState.engine.backgroundState.NetworkController.selectedNetworkClientId =
      'unknown-network';
    expect(selectProviderConfig(noMatchState)).toEqual({
      chainId: '0x89',
      id: 'custom-network',
      nickname: 'Polygon',
      rpcPrefs: {
        blockExplorerUrl: 'https://polygonscan.com',
      },
      rpcUrl: 'https://polygon-rpc.com',
      ticker: 'MATIC',
      type: 'rpc',
    });
  });

  it('selectNetworkConfigurationByChainId should return null if the chainId does not exist', () => {
    expect(selectNetworkConfigurationByChainId(mockState, '0x9999')).toBeNull();
  });
});

describe('per-chain, EIP-1559 and popular-network selectors', () => {
  const MAINNET_INFURA_URL = 'https://mainnet.infura.io/v3/{infuraProjectId}';
  const LINEA_INFURA_URL =
    'https://linea-mainnet.infura.io/v3/{infuraProjectId}';
  const CUSTOM_CHAIN_ID = '0x2a2a';

  const networkConfigurationsByChainId = {
    [CHAIN_IDS.MAINNET]: {
      chainId: CHAIN_IDS.MAINNET,
      nativeCurrency: 'ETH',
      name: 'Ethereum Mainnet',
      defaultRpcEndpointIndex: 1,
      rpcEndpoints: [
        {
          networkClientId: 'mainnet-custom',
          type: 'custom',
          url: 'https://my-mainnet-node.example',
        },
        {
          networkClientId: 'mainnet',
          type: 'infura',
          url: MAINNET_INFURA_URL,
        },
      ],
      blockExplorerUrls: ['https://etherscan.io'],
      defaultBlockExplorerUrlIndex: 0,
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      nativeCurrency: 'ETH',
      name: 'Linea',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'linea-mainnet',
          type: 'infura',
          url: LINEA_INFURA_URL,
        },
      ],
      blockExplorerUrls: ['https://lineascan.build'],
      defaultBlockExplorerUrlIndex: 0,
    },
    [CHAIN_IDS.POLYGON]: {
      chainId: CHAIN_IDS.POLYGON,
      nativeCurrency: 'POL',
      name: 'Polygon',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'polygon-custom',
          type: 'custom',
          url: 'https://polygon-rpc.com',
        },
        {
          networkClientId: 'polygon-backup',
          type: 'custom',
          url: 'https://polygon-backup.example',
        },
      ],
      blockExplorerUrls: ['https://polygonscan.com'],
      defaultBlockExplorerUrlIndex: 0,
    },
    [CHAIN_IDS.SEPOLIA]: {
      chainId: CHAIN_IDS.SEPOLIA,
      nativeCurrency: 'SepoliaETH',
      name: 'Sepolia',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'sepolia',
          type: 'infura',
          url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
        },
      ],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      defaultBlockExplorerUrlIndex: 0,
    },
    [CUSTOM_CHAIN_ID]: {
      chainId: CUSTOM_CHAIN_ID,
      nativeCurrency: 'CUST',
      name: 'My Custom Chain',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'my-custom-chain',
          type: 'custom',
          url: 'https://rpc.my-custom-chain.example',
        },
      ],
      blockExplorerUrls: [],
    },
  };

  const buildState = ({
    selectedNetworkClientId = 'mainnet',
    networksMetadata = {},
    isEvmSelected = true,
    multichainNetworkConfigurationsByChainId = {},
  }: {
    selectedNetworkClientId?: string;
    networksMetadata?: Record<string, unknown>;
    isEvmSelected?: boolean;
    multichainNetworkConfigurationsByChainId?: Record<string, unknown>;
  } = {}) =>
    ({
      engine: {
        backgroundState: {
          NetworkController: {
            selectedNetworkClientId,
            networkConfigurationsByChainId,
            networksMetadata,
          },
          MultichainNetworkController: {
            isEvmSelected,
            selectedMultichainNetworkChainId: SolScope.Mainnet,
            multichainNetworkConfigurationsByChainId,
          },
        },
      },
    } as unknown as RootState);

  describe('selectDefaultEndpointByChainId', () => {
    it('returns the endpoint at defaultRpcEndpointIndex 0', () => {
      expect(
        selectDefaultEndpointByChainId(buildState(), CHAIN_IDS.POLYGON),
      ).toEqual({
        networkClientId: 'polygon-custom',
        type: 'custom',
        url: 'https://polygon-rpc.com',
      });
    });

    it('returns the endpoint at defaultRpcEndpointIndex 1, not the first one', () => {
      expect(
        selectDefaultEndpointByChainId(buildState(), CHAIN_IDS.MAINNET),
      ).toEqual({
        networkClientId: 'mainnet',
        type: 'infura',
        url: MAINNET_INFURA_URL,
      });
    });

    it('returns undefined for an unknown chain', () => {
      expect(
        selectDefaultEndpointByChainId(buildState(), '0xdeadbeef'),
      ).toBeUndefined();
    });
  });

  describe('selectRpcUrlByChainId', () => {
    it('returns the URL of the default endpoint at index 0', () => {
      expect(selectRpcUrlByChainId(buildState(), CHAIN_IDS.POLYGON)).toBe(
        'https://polygon-rpc.com',
      );
    });

    it('returns the URL of the default endpoint at index 1', () => {
      expect(selectRpcUrlByChainId(buildState(), CHAIN_IDS.MAINNET)).toBe(
        MAINNET_INFURA_URL,
      );
    });

    it('returns the URL of an Infura default endpoint', () => {
      expect(selectRpcUrlByChainId(buildState(), CHAIN_IDS.LINEA_MAINNET)).toBe(
        LINEA_INFURA_URL,
      );
    });

    it('returns undefined for an unknown chain', () => {
      expect(selectRpcUrlByChainId(buildState(), '0xdeadbeef')).toBeUndefined();
    });
  });

  describe('selectProviderTypeByChainId', () => {
    it('returns the networkClientId for an Infura default endpoint', () => {
      expect(selectProviderTypeByChainId(buildState(), CHAIN_IDS.MAINNET)).toBe(
        'mainnet',
      );
      expect(
        selectProviderTypeByChainId(buildState(), CHAIN_IDS.LINEA_MAINNET),
      ).toBe('linea-mainnet');
    });

    it('returns "rpc" for a custom default endpoint', () => {
      expect(selectProviderTypeByChainId(buildState(), CHAIN_IDS.POLYGON)).toBe(
        'rpc',
      );
      expect(selectProviderTypeByChainId(buildState(), CUSTOM_CHAIN_ID)).toBe(
        'rpc',
      );
    });

    it('returns undefined for an unknown chain', () => {
      expect(
        selectProviderTypeByChainId(buildState(), '0xdeadbeef'),
      ).toBeUndefined();
    });
  });

  describe('selectIsEIP1559Network', () => {
    it('returns true when the selected network supports EIP-1559', () => {
      expect(
        selectIsEIP1559Network(
          buildState({
            networksMetadata: {
              mainnet: { status: 'available', EIPS: { 1559: true } },
            },
          }),
        ),
      ).toBe(true);
    });

    it('returns false when the selected network does not support EIP-1559', () => {
      expect(
        selectIsEIP1559Network(
          buildState({
            networksMetadata: {
              mainnet: { status: 'available', EIPS: { 1559: false } },
            },
          }),
        ),
      ).toBe(false);
    });

    it('only reads metadata of the selected network client', () => {
      expect(
        selectIsEIP1559Network(
          buildState({
            selectedNetworkClientId: 'polygon-custom',
            networksMetadata: {
              mainnet: { status: 'available', EIPS: { 1559: true } },
              'polygon-custom': { status: 'available', EIPS: {} },
            },
          }),
        ),
      ).toBe(false);
    });

    it('returns false instead of throwing when the selected client has no metadata', () => {
      const state = buildState({
        selectedNetworkClientId: 'my-custom-chain',
        networksMetadata: {
          mainnet: { status: 'available', EIPS: { 1559: true } },
        },
      });
      expect(() => selectIsEIP1559Network(state)).not.toThrow();
      expect(selectIsEIP1559Network(state)).toBe(false);
    });

    it('returns false when the selected client metadata has no EIPS', () => {
      expect(
        selectIsEIP1559Network(
          buildState({
            networksMetadata: { mainnet: { status: 'unknown' } },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectAllPopularNetworkConfigurations', () => {
    it('keeps mainnet, Linea and PopularList chains and drops testnets and custom chains', () => {
      const popular = selectAllPopularNetworkConfigurations(buildState());

      expect(Object.keys(popular).sort()).toEqual(
        [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET, CHAIN_IDS.POLYGON].sort(),
      );
      expect(popular[CHAIN_IDS.SEPOLIA]).toBeUndefined();
      expect(popular[CUSTOM_CHAIN_ID]).toBeUndefined();
      expect(popular[CHAIN_IDS.MAINNET]).toBe(
        networkConfigurationsByChainId[CHAIN_IDS.MAINNET],
      );
    });
  });

  describe('selectIsPopularNetwork', () => {
    it.each([
      ['mainnet', 'mainnet'],
      ['Linea', 'linea-mainnet'],
      ['a PopularList chain (Polygon)', 'polygon-custom'],
    ])('returns true for %s', (_label, selectedNetworkClientId) => {
      expect(
        selectIsPopularNetwork(buildState({ selectedNetworkClientId })),
      ).toBe(true);
    });

    it.each([
      ['a custom chain', 'my-custom-chain'],
      ['a testnet (Sepolia)', 'sepolia'],
    ])('returns false for %s', (_label, selectedNetworkClientId) => {
      expect(
        selectIsPopularNetwork(buildState({ selectedNetworkClientId })),
      ).toBe(false);
    });
  });

  describe('selectNativeNetworkCurrencies', () => {
    it('returns each native currency once across EVM and non-EVM networks', () => {
      const currencies = selectNativeNetworkCurrencies(
        buildState({
          multichainNetworkConfigurationsByChainId: {
            [SolScope.Mainnet]: {
              chainId: SolScope.Mainnet,
              name: 'Solana',
              nativeCurrency: `${SolScope.Mainnet}/token:SOL`,
              isEvm: false,
            },
          },
        }),
      );

      expect(currencies).toHaveLength(new Set(currencies).size);
      expect([...currencies].sort()).toEqual(
        [
          'CUST',
          'ETH',
          'POL',
          'SepoliaETH',
          `${SolScope.Mainnet}/token:SOL`,
        ].sort(),
      );
    });
  });

  describe('createProviderConfig', () => {
    const baseConfig = {
      chainId: '0x2a2a',
      nativeCurrency: 'CUST',
      name: 'My Custom Chain',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [],
      blockExplorerUrls: [
        'https://explorer-a.example',
        'https://explorer-b.example',
      ],
    } as unknown as NetworkConfiguration;

    it('includes id, nickname and rpcUrl for a custom endpoint', () => {
      expect(
        createProviderConfig(baseConfig, {
          networkClientId: 'my-custom-chain',
          type: RpcEndpointType.Custom,
          url: 'https://rpc.my-custom-chain.example',
        }),
      ).toEqual({
        chainId: '0x2a2a',
        ticker: 'CUST',
        rpcPrefs: { blockExplorerUrl: 'https://explorer-a.example' },
        type: 'rpc',
        id: 'my-custom-chain',
        nickname: 'My Custom Chain',
        rpcUrl: 'https://rpc.my-custom-chain.example',
      });
    });

    it('omits id, nickname and rpcUrl for an Infura endpoint', () => {
      const config = createProviderConfig(baseConfig, {
        networkClientId: 'mainnet',
        type: RpcEndpointType.Infura,
        url: MAINNET_INFURA_URL,
      });
      expect(config.type).toBe('mainnet');
      expect(config).not.toHaveProperty('id');
      expect(config).not.toHaveProperty('nickname');
      expect(config).not.toHaveProperty('rpcUrl');
    });

    it('uses defaultBlockExplorerUrlIndex to pick the block explorer', () => {
      expect(
        createProviderConfig(
          { ...baseConfig, defaultBlockExplorerUrlIndex: 1 },
          {
            networkClientId: 'my-custom-chain',
            type: RpcEndpointType.Custom,
            url: 'https://rpc.my-custom-chain.example',
          },
        ).rpcPrefs,
      ).toEqual({ blockExplorerUrl: 'https://explorer-b.example' });
    });

    it('leaves rpcPrefs empty when there is no block explorer at the index', () => {
      expect(
        createProviderConfig(
          { ...baseConfig, blockExplorerUrls: [] },
          {
            networkClientId: 'my-custom-chain',
            type: RpcEndpointType.Custom,
            url: 'https://rpc.my-custom-chain.example',
          },
        ).rpcPrefs,
      ).toEqual({});
    });
  });
});
