import { SolScope } from '@metamask/keyring-api';
import { RootState } from '../reducers';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_2,
} from '../util/test/accountsControllerTestUtils';
import { mockNetworkState } from '../util/test/network';
import mockedEngine from '../core/__mocks__/MockedEngine';
import {
  selectAccountBalanceByChainId,
  selectAccounts,
  selectAccountsByChainId,
} from './accountTrackerController';

const mockIsEqual = jest.fn();
jest.mock('lodash', () => {
  const actual = jest.requireActual('lodash');
  return {
    ...actual,
    isEqual: (a: unknown, b: unknown) => {
      mockIsEqual(a, b);
      return actual.isEqual(a, b);
    },
  };
});

jest.mock('../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

const MOCK_CHAIN_ID = '0x1';

const networkState = mockNetworkState({
  chainId: MOCK_CHAIN_ID,
  id: 'mainnet',
  nickname: 'Ethereum Mainnet',
  ticker: 'ETH',
});

const buildState = (balance: string) =>
  ({
    engine: {
      backgroundState: {
        NetworkController: networkState,
        AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
        AccountTrackerController: {
          accountsByChainId: {
            [MOCK_CHAIN_ID]: { [MOCK_ADDRESS_2]: { balance } },
            '0x89': { [MOCK_ADDRESS_2]: { balance: '0x5' } },
          },
          accounts: { [MOCK_ADDRESS_2]: { balance } },
        },
        MultichainNetworkController: {
          isEvmSelected: true,
          selectedMultichainNetworkChainId: SolScope.Mainnet,
          multichainNetworkConfigurationsByChainId: {},
        },
      },
    },
  } as unknown as RootState);

const selectAll = (state: RootState) => ({
  byChainId: selectAccountsByChainId(state),
  accounts: selectAccounts(state),
  balance: selectAccountBalanceByChainId(state),
});

describe('accountTrackerController selectors deep comparison', () => {
  it('deep-compares only accountsByChainId, once, when polling rewrites identical balances', () => {
    const first = buildState('0x1');
    const before = selectAll(first);
    mockIsEqual.mockClear();

    const polled = buildState('0x1');
    const after = selectAll(polled);

    const controllerState =
      polled.engine.backgroundState.AccountTrackerController;
    const calls = mockIsEqual.mock.calls;
    expect(calls.some(([, b]) => b === controllerState)).toBe(false);
    expect(
      calls.filter(([, b]) => b === controllerState.accountsByChainId),
    ).toHaveLength(1);

    expect(after.byChainId).toBe(before.byChainId);
    expect(after.accounts).toBe(before.accounts);
    expect(after.balance).toBe(before.balance);
  });

  it('returns updated values when a balance changes', () => {
    const before = selectAll(buildState('0x1'));
    const after = selectAll(buildState('0x2'));

    expect(after.byChainId).not.toBe(before.byChainId);
    expect(after.accounts).toStrictEqual({
      [MOCK_ADDRESS_2]: { balance: '0x2' },
    });
    expect(after.balance).toStrictEqual({ balance: '0x2' });
  });
});
