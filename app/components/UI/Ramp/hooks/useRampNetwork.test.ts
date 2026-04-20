import { AggregatorNetwork } from '@consensys/on-ramp-sdk/dist/API';
import useRampNetwork from './useRampNetwork';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildState = (chainId: string, networks: AggregatorNetwork[]): any => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      NetworkController: {
        ...backgroundState.NetworkController,
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          [`0x${Number(chainId).toString(16)}`]: {
            chainId: `0x${Number(chainId).toString(16)}`,
            name: 'Test',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                url: 'https://example.com',
                type: 'custom',
              },
            ],
            defaultRpcEndpointIndex: 0,
            blockExplorerUrls: [],
          },
        },
      },
    },
  },
  fiatOrders: {
    networks,
  },
});

describe('useRampNetwork', () => {
  it('returns [true, true] when the chain is supported and native token is supported', () => {
    const networks: AggregatorNetwork[] = [
      {
        active: true,
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeTokenSupported: true,
      },
    ];
    const { result } = renderHookWithProvider(() => useRampNetwork(), {
      state: buildState('1', networks),
    });
    expect(result.current).toEqual([true, true]);
  });

  it('returns [true, false] when the chain is supported but native token is not', () => {
    const networks: AggregatorNetwork[] = [
      {
        active: true,
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeTokenSupported: false,
      },
    ];
    const { result } = renderHookWithProvider(() => useRampNetwork(), {
      state: buildState('1', networks),
    });
    expect(result.current).toEqual([true, false]);
  });

  it('returns [false, false] when the chain is not in the supported networks list', () => {
    const networks: AggregatorNetwork[] = [
      {
        active: true,
        chainId: '1337',
        chainName: 'Other',
        shortName: 'other',
        nativeTokenSupported: true,
      },
    ];
    const { result } = renderHookWithProvider(() => useRampNetwork(), {
      state: buildState('1', networks),
    });
    expect(result.current).toEqual([false, false]);
  });
});
