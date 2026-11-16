import { SolScope } from '@metamask/keyring-api';
import { RootState } from '../reducers';
import { backgroundState } from '../util/test/initial-root-state';
import { renderHookWithProvider } from '../util/test/renderWithProvider';
// eslint-disable-next-line import/no-namespace
import * as networks from '../util/networks';
import {
  makeSelectChainId,
  makeSelectDomainIsConnectedDapp,
  makeSelectDomainNetworkClientId,
  makeSelectNetworkImageSource,
  makeSelectNetworkName,
  makeSelectRpcUrl,
  selectNetworkClientIdsByDomains,
  useNetworkInfo,
} from './selectedNetworkController';

const MAINNET_INFURA_URL = 'https://mainnet.infura.io/v3/{infuraProjectId}';
const MAINNET_CUSTOM_URL = 'https://my-mainnet.example.com';
const POLYGON_URL = 'https://polygon-rpc.com';
const BASE_URL = 'https://base.example.com';

const networkConfigurationsByChainId = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      { networkClientId: 'mainnet', type: 'infura', url: MAINNET_INFURA_URL },
      {
        networkClientId: 'mainnet-custom',
        type: 'custom',
        url: MAINNET_CUSTOM_URL,
        name: 'My Mainnet RPC',
      },
    ],
  },
  '0xaa36a7': {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'sepolia',
        type: 'infura',
        url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0x89': {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    nativeCurrency: 'POL',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'polygon-client',
        type: 'custom',
        url: POLYGON_URL,
        name: 'Polygon RPC',
      },
    ],
  },
  '0x2105': {
    chainId: '0x2105',
    name: 'Base Mainnet',
    nativeCurrency: 'ETH',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      { networkClientId: 'base-client', type: 'custom', url: BASE_URL },
    ],
  },
};

const domains = {
  'polygon.dapp': 'polygon-client',
  'base.dapp': 'base-client',
  'sepolia.dapp': 'sepolia',
  'mainnet-custom.dapp': 'mainnet-custom',
  'linea.dapp': 'linea-mainnet',
  'stale.dapp': 'removed-client',
};

const buildState = ({
  selectedNetworkClientId = 'mainnet',
  networkConfigurations = networkConfigurationsByChainId,
}: {
  selectedNetworkClientId?: string;
  networkConfigurations?: Record<string, unknown>;
} = {}) =>
  ({
    engine: {
      backgroundState: {
        ...backgroundState,
        NetworkController: {
          ...backgroundState.NetworkController,
          selectedNetworkClientId,
          networkConfigurationsByChainId: networkConfigurations,
        },
        SelectedNetworkController: { domains },
      },
    },
  } as unknown as RootState);

const getNetworkImageSource = (
  args: Parameters<typeof networks.getNetworkImageSource>[0],
) => ({ imageFor: args });

describe('selectedNetworkController selectors', () => {
  let perDappFlagSpy: jest.SpyInstance;

  const enablePerDappNetwork = () => {
    perDappFlagSpy.mockReturnValue(true);
  };

  beforeEach(() => {
    perDappFlagSpy = jest
      .spyOn(networks, 'isPerDappSelectedNetworkEnabled')
      .mockReturnValue(false);
    jest
      .spyOn(networks, 'getNetworkImageSource')
      .mockImplementation(getNetworkImageSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('selectNetworkClientIdsByDomains / makeSelectDomainNetworkClientId', () => {
    it('returns the domains map', () => {
      expect(selectNetworkClientIdsByDomains(buildState())).toEqual(domains);
    });

    it('returns the networkClientId mapped to a hostname', () => {
      const select = makeSelectDomainNetworkClientId();
      expect(select(buildState(), 'polygon.dapp')).toBe('polygon-client');
    });

    it('returns undefined for an unmapped hostname or no hostname', () => {
      const select = makeSelectDomainNetworkClientId();
      expect(select(buildState(), 'unknown.dapp')).toBeUndefined();
      expect(select(buildState())).toBeUndefined();
    });
  });

  describe('makeSelectNetworkName provider fallback (selectProviderNetworkName)', () => {
    it('returns the NetworkList name for a built-in infura network', () => {
      expect(makeSelectNetworkName()(buildState())).toBe(
        'Ethereum Main Network',
      );
    });

    it('returns the rpc endpoint name for a custom rpc network', () => {
      const state = buildState({ selectedNetworkClientId: 'polygon-client' });
      expect(makeSelectNetworkName()(state)).toBe('Polygon RPC');
    });

    it('falls back to the network nickname when the rpc endpoint has no name', () => {
      const state = buildState({ selectedNetworkClientId: 'base-client' });
      expect(makeSelectNetworkName()(state)).toBe('Base Mainnet');
    });

    it('returns the NetworkList rpc name when the selected network is unknown', () => {
      const state = buildState({ selectedNetworkClientId: 'missing-client' });
      expect(makeSelectNetworkName()(state)).toBe('Private Network');
    });

    it('returns the configuration name for a non-EVM chain', () => {
      const state = buildState({
        selectedNetworkClientId: 'solana-client',
        networkConfigurations: {
          ...networkConfigurationsByChainId,
          [SolScope.Mainnet]: {
            chainId: SolScope.Mainnet,
            name: 'Solana Mainnet',
            nativeCurrency: 'SOL',
            blockExplorerUrls: [],
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'solana-client',
                type: 'custom',
                url: 'https://solana.example.com',
              },
            ],
          },
        },
      });
      expect(makeSelectNetworkName()(state)).toBe('Solana Mainnet');
      expect(makeSelectRpcUrl()(state, 'polygon.dapp')).toBeUndefined();
    });
  });

  describe('makeSelectNetworkName', () => {
    it('returns the provider network name when the flag is off', () => {
      expect(makeSelectNetworkName()(buildState(), 'polygon.dapp')).toBe(
        'Ethereum Main Network',
      );
    });

    it('returns the provider network name without a hostname when the flag is on', () => {
      enablePerDappNetwork();
      expect(makeSelectNetworkName()(buildState())).toBe(
        'Ethereum Main Network',
      );
    });

    it('uses the domain networkClientId on another chain over the global one', () => {
      enablePerDappNetwork();
      expect(makeSelectNetworkName()(buildState(), 'polygon.dapp')).toBe(
        'Polygon RPC',
      );
    });

    it('uses the domain networkClientId on the global chain', () => {
      enablePerDappNetwork();
      expect(makeSelectNetworkName()(buildState(), 'mainnet-custom.dapp')).toBe(
        'My Mainnet RPC',
      );
    });

    it('falls back to the global networkClientId for an unmapped domain', () => {
      enablePerDappNetwork();
      const state = buildState({ selectedNetworkClientId: 'polygon-client' });
      expect(makeSelectNetworkName()(state, 'unknown.dapp')).toBe(
        'Polygon RPC',
      );
    });

    it('falls back to NetworkList when the rpc endpoint has no name', () => {
      enablePerDappNetwork();
      expect(makeSelectNetworkName()(buildState(), 'sepolia.dapp')).toBe(
        'Sepolia',
      );
      expect(makeSelectNetworkName()(buildState(), 'linea.dapp')).toBe(
        'Linea Main Network',
      );
    });

    it('falls back to the network configuration name for an unnamed custom endpoint', () => {
      enablePerDappNetwork();
      expect(makeSelectNetworkName()(buildState(), 'base.dapp')).toBe(
        'Base Mainnet',
      );
    });

    it('returns undefined when the domain networkClientId no longer exists', () => {
      enablePerDappNetwork();
      expect(
        makeSelectNetworkName()(buildState(), 'stale.dapp'),
      ).toBeUndefined();
    });
  });

  describe('makeSelectChainId', () => {
    it('returns the provider chain id when the flag is off', () => {
      expect(makeSelectChainId()(buildState(), 'polygon.dapp')).toBe('0x1');
    });

    it('returns the provider chain id without a hostname when the flag is on', () => {
      enablePerDappNetwork();
      expect(makeSelectChainId()(buildState())).toBe('0x1');
    });

    it('returns the chain id of the domain network', () => {
      enablePerDappNetwork();
      expect(makeSelectChainId()(buildState(), 'polygon.dapp')).toBe('0x89');
      expect(makeSelectChainId()(buildState(), 'sepolia.dapp')).toBe(
        '0xaa36a7',
      );
    });

    it('falls back to the global network for an unmapped domain', () => {
      enablePerDappNetwork();
      const state = buildState({ selectedNetworkClientId: 'polygon-client' });
      expect(makeSelectChainId()(state, 'unknown.dapp')).toBe('0x89');
    });

    it('falls back to NetworkList for an unconfigured built-in network', () => {
      enablePerDappNetwork();
      expect(makeSelectChainId()(buildState(), 'linea.dapp')).toBe('0xe708');
    });

    it('falls back to the provider chain id when the domain networkClientId no longer exists', () => {
      enablePerDappNetwork();
      expect(makeSelectChainId()(buildState(), 'stale.dapp')).toBe('0x1');
    });
  });

  describe('makeSelectRpcUrl', () => {
    it('returns the provider rpc url when the flag is off', () => {
      const state = buildState({ selectedNetworkClientId: 'mainnet-custom' });
      expect(makeSelectRpcUrl()(state, 'polygon.dapp')).toBe(
        MAINNET_CUSTOM_URL,
      );
    });

    it('returns the provider rpc url without a hostname when the flag is on', () => {
      enablePerDappNetwork();
      const state = buildState({ selectedNetworkClientId: 'mainnet-custom' });
      expect(makeSelectRpcUrl()(state)).toBe(MAINNET_CUSTOM_URL);
    });

    it('returns the rpc url of the domain network', () => {
      enablePerDappNetwork();
      expect(makeSelectRpcUrl()(buildState(), 'polygon.dapp')).toBe(
        POLYGON_URL,
      );
      expect(makeSelectRpcUrl()(buildState(), 'mainnet-custom.dapp')).toBe(
        MAINNET_CUSTOM_URL,
      );
    });

    it('falls back to the global networkClientId for an unmapped domain', () => {
      enablePerDappNetwork();
      expect(makeSelectRpcUrl()(buildState(), 'unknown.dapp')).toBe(
        MAINNET_INFURA_URL,
      );
    });

    it('returns undefined when no rpc endpoint matches', () => {
      enablePerDappNetwork();
      expect(makeSelectRpcUrl()(buildState(), 'stale.dapp')).toBeUndefined();
    });
  });

  describe('makeSelectNetworkImageSource', () => {
    it('returns the provider image when the flag is off', () => {
      expect(
        makeSelectNetworkImageSource()(buildState(), 'polygon.dapp'),
      ).toEqual(
        getNetworkImageSource({ networkType: 'mainnet', chainId: '0x1' }),
      );
    });

    it('returns the image of the domain network', () => {
      enablePerDappNetwork();
      expect(
        makeSelectNetworkImageSource()(buildState(), 'polygon.dapp'),
      ).toEqual(getNetworkImageSource({ chainId: '0x89' }));
    });

    it('falls back to NetworkList for an unconfigured built-in network', () => {
      enablePerDappNetwork();
      expect(
        makeSelectNetworkImageSource()(buildState(), 'linea.dapp'),
      ).toEqual(
        getNetworkImageSource({
          networkType: 'linea-mainnet',
          chainId: '0xe708',
        }),
      );
    });
  });

  describe('makeSelectDomainIsConnectedDapp', () => {
    it('returns true for a hostname with a networkClientId', () => {
      expect(
        makeSelectDomainIsConnectedDapp()(buildState(), 'polygon.dapp'),
      ).toBe(true);
    });

    it('returns false for an unmapped hostname or no hostname', () => {
      const select = makeSelectDomainIsConnectedDapp();
      expect(select(buildState(), 'unknown.dapp')).toBe(false);
      expect(select(buildState())).toBe(false);
    });
  });

  describe('useNetworkInfo', () => {
    it('returns the global network info when the flag is off', () => {
      const { result } = renderHookWithProvider(
        () => useNetworkInfo('polygon.dapp'),
        { state: buildState() },
      );
      expect(result.current).toEqual({
        networkName: 'Ethereum Main Network',
        networkImageSource: getNetworkImageSource({
          networkType: 'mainnet',
          chainId: '0x1',
        }),
        domainNetworkClientId: 'polygon-client',
        chainId: '0x1',
        rpcUrl: undefined,
        domainIsConnectedDapp: true,
      });
    });

    it('returns the domain network info when the flag is on', () => {
      enablePerDappNetwork();
      const { result } = renderHookWithProvider(
        () => useNetworkInfo('polygon.dapp'),
        { state: buildState() },
      );
      expect(result.current).toEqual({
        networkName: 'Polygon RPC',
        networkImageSource: getNetworkImageSource({ chainId: '0x89' }),
        domainNetworkClientId: 'polygon-client',
        chainId: '0x89',
        rpcUrl: POLYGON_URL,
        domainIsConnectedDapp: true,
      });
    });
  });
});
