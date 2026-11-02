import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import Engine from '../../../core/Engine';
import { Asset } from './useAddressBalance.types';
import useAddressBalance from './useAddressBalance';
import backgroundState from '../../../util/test/initial-root-state';
import { createMockAccountsControllerState } from '../../../util/test/accountsControllerTestUtils';
import { SolScope } from '@metamask/keyring-api';
import type BN5 from 'bnjs5';
import { mockNetworkState } from '../../../util/test/network';
const MOCK_ADDRESS_1 = '0x0';
const MOCK_ADDRESS_2 = '0x1';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
]);

const mockStore = configureMockStore();
const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': {
            [MOCK_ADDRESS_1]: {
              balance: '0x4a7036655fab2ca3',
            },
            [MOCK_ADDRESS_2]: {
              balance: '0x5',
            },
          },
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          [MOCK_ADDRESS_1]: {
            '0x1': {
              '0x326836cc6cd09B5aa59B81A7F72F25FcC0136b95': '0x5',
            },
          },
        },
      },
      PreferencesController: {
        selectedAddress: MOCK_ADDRESS_1,
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      MultichainNetworkController: {
        isEvmSelected: true,
        selectedMultichainNetworkChainId: SolScope.Mainnet,

        multichainNetworkConfigurationsByChainId: {},
      },
      NetworkController: {
        ...mockNetworkState({
          chainId: '0x1',
          id: 'mainnet',
          nickname: 'Ethereum Mainnet',
          ticker: 'ETH',
          blockExplorerUrl: 'https://goerli.lineascan.build',
        }),
      },
    },
  },
};
const store = mockStore(mockInitialState);
let mockCurrentState: object = mockInitialState;

const MOCK_TOKEN_ADDRESS = '0x326836cc6cd09B5aa59B81A7F72F25FcC0136b95';

const withBalances = (
  accountBalances: Record<string, string>,
  selectedTokenBalance: string,
) => ({
  ...mockInitialState,
  engine: {
    ...mockInitialState.engine,
    backgroundState: {
      ...mockInitialState.engine.backgroundState,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': Object.fromEntries(
            Object.entries(accountBalances).map(([account, balance]) => [
              account,
              { balance },
            ]),
          ),
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          [MOCK_ADDRESS_1]: {
            '0x1': { [MOCK_TOKEN_ADDRESS]: selectedTokenBalance },
          },
        },
      },
    },
  },
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest
    .fn()
    .mockImplementation((callback) => callback(mockCurrentState)),
}));

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Wrapper = ({ children }: any) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAddressBalance', () => {
  let mockGetERC20BalanceOf: (
    address: string,
    selectedAddress: string,
    networkClientId?: string | undefined,
  ) => Promise<BN5>;
  beforeEach(() => {
    mockCurrentState = mockInitialState;
    mockGetERC20BalanceOf = jest
      .fn()
      .mockReturnValue(Promise.resolve(0x0186a0));
    //@ts-expect-error - for test purposes is not needed to add the other properties of AssetsContractController
    Engine.context.AssetsContractController = {
      getERC20BalanceOf: mockGetERC20BalanceOf,
    };
  });

  it('should render balance from AccountTrackerController.accounts for ETH', () => {
    let res = renderHook(
      () => useAddressBalance({ isETH: true } as Asset, MOCK_ADDRESS_1),
      {
        wrapper: Wrapper,
      },
    );
    expect(res.result.current.addressBalance).toStrictEqual('5.36385 ETH');
    res = renderHook(
      () => useAddressBalance({ isETH: true } as Asset, MOCK_ADDRESS_2),
      {
        wrapper: Wrapper,
      },
    );
    expect(res.result.current.addressBalance).toStrictEqual('< 0.00001 ETH');
  });

  it('should render balance from AssetsContractController.getERC20BalanceOf if selectedAddress is different from fromAddress', () => {
    const asset = {
      address: '0x326836cc6cd09B5aa59B81A7F72F25FcC0136b95',
      symbol: 'TST',
      decimals: 4,
    };
    renderHook(() => useAddressBalance(asset, MOCK_ADDRESS_2), {
      wrapper: Wrapper,
    });
    expect(mockGetERC20BalanceOf).toBeCalledTimes(1);
  });

  it('should render balance if asset is undefined', () => {
    let asset: Asset;
    let res = renderHook(() => useAddressBalance(asset, MOCK_ADDRESS_1), {
      wrapper: Wrapper,
    });
    expect(res.result.current.addressBalance).toStrictEqual('5.36385 ETH');
    res = renderHook(
      () => useAddressBalance({ isETH: true } as Asset, MOCK_ADDRESS_2),
      {
        wrapper: Wrapper,
      },
    );
    expect(res.result.current.addressBalance).toStrictEqual('< 0.00001 ETH');
  });

  it('should render balance from TokenBalancesController.contractBalances if selectedAddress is same as fromAddress', () => {
    const res = renderHook(
      () =>
        useAddressBalance(
          {
            address: '0x326836cc6cd09B5aa59B81A7F72F25FcC0136b95',
            symbol: 'TST',
            decimals: 4,
          },
          MOCK_ADDRESS_1,
        ),
      {
        wrapper: Wrapper,
      },
    );
    expect(mockGetERC20BalanceOf).toBeCalledTimes(0);
    expect(res.result.current.addressBalance).toStrictEqual('0.0005 TST');
  });

  it('does not re-issue getERC20BalanceOf when unrelated account or token balances change', async () => {
    const asset = { address: MOCK_TOKEN_ADDRESS, symbol: 'TST', decimals: 4 };
    const { result, rerender } = renderHook(
      () => useAddressBalance(asset, MOCK_ADDRESS_2),
      { wrapper: Wrapper },
    );
    await waitFor(() =>
      expect(result.current.addressBalance).toStrictEqual('10 TST'),
    );

    for (const balance of ['0x10', '0x20', '0x30']) {
      mockCurrentState = withBalances(
        { [MOCK_ADDRESS_1]: balance, [MOCK_ADDRESS_2]: '0x5' },
        balance,
      );
      rerender({});
    }
    await act(async () => undefined);

    expect(mockGetERC20BalanceOf).toHaveBeenCalledTimes(1);
    expect(result.current.addressBalance).toStrictEqual('10 TST');
  });

  it('does not re-issue getERC20BalanceOf when the asset object identity changes', async () => {
    const { rerender } = renderHook(
      () =>
        useAddressBalance(
          { address: MOCK_TOKEN_ADDRESS, symbol: 'TST', decimals: 4 },
          MOCK_ADDRESS_2,
        ),
      { wrapper: Wrapper },
    );
    rerender({});
    rerender({});
    await act(async () => undefined);

    expect(mockGetERC20BalanceOf).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale getERC20BalanceOf response after the address changes', async () => {
    const resolvers: Record<string, (value: number) => void> = {};
    (mockGetERC20BalanceOf as jest.Mock).mockImplementation(
      (_contract: string, owner: string) =>
        new Promise((resolve) => {
          resolvers[owner] = resolve;
        }),
    );
    const asset = { address: MOCK_TOKEN_ADDRESS, symbol: 'TST', decimals: 0 };
    const { result, rerender } = renderHook(
      ({ from }: { from: string }) => useAddressBalance(asset, from),
      { wrapper: Wrapper, initialProps: { from: MOCK_ADDRESS_2 } },
    );
    rerender({ from: '0x2' });
    expect(mockGetERC20BalanceOf).toHaveBeenCalledTimes(2);

    await act(async () => resolvers['0x2'](7));
    await act(async () => resolvers[MOCK_ADDRESS_2](3));

    expect(result.current.addressBalance).toStrictEqual('7 TST');
  });

  it('updates the selected account token balance from TokenBalancesController without RPC', () => {
    const asset = { address: MOCK_TOKEN_ADDRESS, symbol: 'TST', decimals: 4 };
    const { result, rerender } = renderHook(
      () => useAddressBalance(asset, MOCK_ADDRESS_1),
      { wrapper: Wrapper },
    );
    expect(result.current.addressBalance).toStrictEqual('0.0005 TST');

    mockCurrentState = withBalances(
      { [MOCK_ADDRESS_1]: '0x4a7036655fab2ca3', [MOCK_ADDRESS_2]: '0x5' },
      '0x2710',
    );
    rerender({});

    expect(result.current.addressBalance).toStrictEqual('1 TST');
    expect(mockGetERC20BalanceOf).toHaveBeenCalledTimes(0);
  });

  it('updates the native balance when the address balance changes', () => {
    const { result, rerender } = renderHook(
      () => useAddressBalance({ isETH: true } as Asset, MOCK_ADDRESS_2),
      { wrapper: Wrapper },
    );
    expect(result.current.addressBalance).toStrictEqual('< 0.00001 ETH');

    mockCurrentState = withBalances(
      {
        [MOCK_ADDRESS_1]: '0x4a7036655fab2ca3',
        [MOCK_ADDRESS_2]: '0xde0b6b3a7640000',
      },
      '0x5',
    );
    rerender({});

    expect(result.current.addressBalance).toStrictEqual('1 ETH');
  });
});
