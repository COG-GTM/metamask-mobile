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
} from './networkController';
import { RootState } from '../reducers';
import { SolScope } from '@metamask/keyring-api';

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

describe('selectProviderConfig memoization', () => {
  const polygonConfig = {
    chainId: '0x89',
    nativeCurrency: 'MATIC',
    name: 'Polygon',
    rpcEndpoints: [
      {
        networkClientId: 'polygon-client',
        type: 'custom',
        url: 'https://polygon-rpc.com',
      },
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
  };
  const mainnetConfig = {
    chainId: '0x1',
    nativeCurrency: 'ETH',
    name: 'Ethereum Mainnet',
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: 'infura',
        url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
    blockExplorerUrls: ['https://etherscan.io'],
  };

  const buildState = (networkController: Record<string, unknown>) =>
    ({
      engine: {
        backgroundState: {
          NetworkController: networkController,
        },
      },
    } as unknown as RootState);

  const baseController = {
    selectedNetworkClientId: 'polygon-client',
    networkConfigurationsByChainId: {
      '0x1': mainnetConfig,
      '0x89': polygonConfig,
    },
    networksMetadata: {
      'polygon-client': { status: 'unknown', EIPS: {} },
    },
  };

  beforeEach(() => {
    selectProviderConfig.clearCache();
    selectProviderConfig.memoizedResultFunc.clearCache();
    selectProviderConfig.resetRecomputations();
  });

  it('returns the same reference without recomputing when only networksMetadata changes', () => {
    const first = selectProviderConfig(buildState(baseController));

    const second = selectProviderConfig(
      buildState({
        ...baseController,
        networksMetadata: {
          'polygon-client': { status: 'available', EIPS: { 1559: true } },
        },
      }),
    );

    expect(second).toBe(first);
    expect(selectProviderConfig.recomputations()).toBe(1);
  });

  it('keeps the same reference when an unrelated network configuration changes', () => {
    const first = selectProviderConfig(buildState(baseController));

    const second = selectProviderConfig(
      buildState({
        ...baseController,
        networkConfigurationsByChainId: {
          '0x1': { ...mainnetConfig, name: 'Renamed Mainnet' },
          '0x89': polygonConfig,
        },
      }),
    );

    expect(second).toBe(first);
  });

  it('returns a new provider config when the selected network client changes', () => {
    const first = selectProviderConfig(buildState(baseController));

    const second = selectProviderConfig(
      buildState({ ...baseController, selectedNetworkClientId: 'mainnet' }),
    );

    expect(second).not.toBe(first);
    expect(second).toEqual({
      chainId: '0x1',
      ticker: 'ETH',
      rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
      type: 'mainnet',
    });
  });

  it('returns a new provider config when the selected network configuration changes', () => {
    const first = selectProviderConfig(buildState(baseController));

    const second = selectProviderConfig(
      buildState({
        ...baseController,
        networkConfigurationsByChainId: {
          '0x1': mainnetConfig,
          '0x89': { ...polygonConfig, name: 'Polygon PoS' },
        },
      }),
    );

    expect(second).not.toBe(first);
    expect(second.nickname).toBe('Polygon PoS');
  });

  it('returns the default provider config when NetworkController state is missing', () => {
    expect(
      selectProviderConfig({
        engine: { backgroundState: {} },
      } as unknown as RootState),
    ).toEqual({
      chainId: '0x1',
      ticker: 'ETH',
      rpcPrefs: {},
      type: 'infura',
    });
  });
});
