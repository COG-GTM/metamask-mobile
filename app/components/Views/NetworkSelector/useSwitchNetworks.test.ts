import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from '../../../util/test/configureStore';
import { backgroundState } from '../../../util/test/initial-root-state';

const renderHookWithProvider = <TProps, TResult>(
  callback: (props: TProps) => TResult,
  { state }: { state: Record<string, unknown> },
) => {
  const store = configureStore(state);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      Provider as React.ComponentType<{
        store: typeof store;
        children?: React.ReactNode;
      }>,
      { store, children },
    );
  return renderHook(callback, { wrapper });
};
import Engine from '../../../core/Engine';
import { useSwitchNetworks } from './useSwitchNetworks';
import { isMultichainV1Enabled } from '../../../util/networks';
import { updateIncomingTransactions } from '../../../util/transaction-controller';

jest.mock('../../../core/Engine', () => ({
  context: {
    MultichainNetworkController: {
      setActiveNetwork: jest.fn(),
    },
    SelectedNetworkController: {
      setNetworkClientIdForDomain: jest.fn(),
    },
    PreferencesController: {
      setTokenNetworkFilter: jest.fn(),
    },
    AccountTrackerController: {
      refresh: jest.fn(),
    },
  },
}));

jest.mock('../../../util/networks', () => {
  const actual = jest.requireActual('../../../util/networks');
  return {
    ...actual,
    isMultichainV1Enabled: jest.fn(() => false),
    getDecimalChainId: (chainId: string) => String(parseInt(chainId, 16)),
  };
});

jest.mock('../../../util/transaction-controller', () => ({
  updateIncomingTransactions: jest.fn(),
}));

jest.mock('../../../util/trace', () => ({
  trace: jest.fn(),
  endTrace: jest.fn(),
  TraceName: {
    SwitchCustomNetwork: 'SwitchCustomNetwork',
    SwitchBuiltInNetwork: 'SwitchBuiltInNetwork',
    NetworkSwitch: 'NetworkSwitch',
  },
  TraceOperation: {
    SwitchCustomNetwork: 'SwitchCustomNetwork',
    SwitchBuiltInNetwork: 'SwitchBuiltInNetwork',
  },
}));

jest.mock('../../hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
  }),
  MetaMetricsEvents: {
    NETWORK_SWITCHED: 'NETWORK_SWITCHED',
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const initialState = { engine: { backgroundState } };

describe('useSwitchNetworks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns onSetRpcTarget and onNetworkChange callbacks', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSwitchNetworks({
          selectedChainId: '0x1',
          selectedNetworkName: 'Mainnet',
        }),
      { state: initialState },
    );

    expect(typeof result.current.onSetRpcTarget).toBe('function');
    expect(typeof result.current.onNetworkChange).toBe('function');
  });

  it('returns early from onSetRpcTarget when given no network configuration', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useSwitchNetworks({
          selectedChainId: '0x1',
          selectedNetworkName: 'Mainnet',
        }),
      { state: initialState },
    );

    await result.current.onSetRpcTarget(
      null as unknown as Parameters<typeof result.current.onSetRpcTarget>[0],
    );

    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).not.toHaveBeenCalled();
  });

  it('calls setActiveNetwork when onSetRpcTarget runs for a non-dapp origin', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useSwitchNetworks({
          selectedChainId: '0x1',
          selectedNetworkName: 'Mainnet',
          dismissModal: jest.fn(),
        }),
      { state: initialState },
    );

    await result.current.onSetRpcTarget({
      chainId: '0x1',
      name: 'Mainnet',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'mainnet',
          type: 'infura',
          url: 'https://mainnet.infura.io',
        },
      ],
    } as unknown as Parameters<typeof result.current.onSetRpcTarget>[0]);

    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).toHaveBeenCalledWith('mainnet');
  });

  it('uses SelectedNetworkController when domain is a connected dapp and multichainV1 is enabled', async () => {
    (isMultichainV1Enabled as jest.Mock).mockReturnValue(true);

    const { result } = renderHookWithProvider(
      () =>
        useSwitchNetworks({
          domainIsConnectedDapp: true,
          origin: 'https://example.com',
          selectedChainId: '0x1',
          selectedNetworkName: 'Mainnet',
        }),
      { state: initialState },
    );

    await result.current.onSetRpcTarget({
      chainId: '0x1',
      name: 'Mainnet',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'mainnet',
          type: 'infura',
          url: 'https://mainnet.infura.io',
        },
      ],
    } as unknown as Parameters<typeof result.current.onSetRpcTarget>[0]);

    expect(
      Engine.context.SelectedNetworkController.setNetworkClientIdForDomain,
    ).toHaveBeenCalledWith('https://example.com', 'mainnet');
    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).not.toHaveBeenCalled();
  });

  it('schedules an updateIncomingTransactions call after onNetworkChange succeeds', async () => {
    jest.useFakeTimers();
    (isMultichainV1Enabled as jest.Mock).mockReturnValue(false);

    const state = {
      engine: {
        backgroundState: {
          ...backgroundState,
          NetworkController: {
            ...backgroundState.NetworkController,
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    networkClientId: 'mainnet',
                    type: 'infura',
                    url: 'https://mainnet.infura.io',
                  },
                ],
                blockExplorerUrls: [],
                name: 'Mainnet',
                nativeCurrency: 'ETH',
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithProvider(
      () =>
        useSwitchNetworks({
          selectedChainId: '0x1',
          selectedNetworkName: 'Mainnet',
          closeRpcModal: jest.fn(),
          dismissModal: jest.fn(),
        }),
      { state },
    );

    await result.current.onNetworkChange(
      'mainnet' as unknown as Parameters<
        typeof result.current.onNetworkChange
      >[0],
    );

    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).toHaveBeenCalled();

    jest.advanceTimersByTime(1500);
    await Promise.resolve();

    expect(updateIncomingTransactions).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
