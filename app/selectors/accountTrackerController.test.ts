import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
  expectedUuid,
} from '../util/test/accountsControllerTestUtils';
import { RootState } from '../reducers';
import {
  selectAccountBalanceByChainId,
  selectAccounts,
  selectAccountsByChainId,
} from './accountTrackerController';
import { mockNetworkState } from '../util/test/network';
import mockedEngine from '../core/__mocks__/MockedEngine';
import { SolScope } from '@metamask/keyring-api';

const MOCK_CHAIN_ID = '0x1';

jest.mock('../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

describe('selectAccountBalanceByChainId', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns account balance for chain id', () => {
    const result = selectAccountBalanceByChainId({
      engine: {
        backgroundState: {
          NetworkController: {
            ...mockNetworkState({
              chainId: MOCK_CHAIN_ID,
              id: 'mainnet',
              nickname: 'Ethereum Mainnet',
              ticker: 'ETH',
            }),
          },
          AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
          AccountTrackerController: {
            accountsByChainId: {
              [MOCK_CHAIN_ID]: {
                [MOCK_ADDRESS_2]: { balance: '0x1' },
              },
            },
          },
          MultichainNetworkController: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: SolScope.Mainnet,
            multichainNetworkConfigurationsByChainId: {},
          },
        },
      },
    } as unknown as RootState);
    expect(result?.balance).toBe('0x1');
  });
  it('returns undefined when chain ID is undefined', () => {
    const result = selectAccountBalanceByChainId({
      engine: {
        backgroundState: {
          MultichainNetworkController: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: SolScope.Mainnet,

            multichainNetworkConfigurationsByChainId: {},
          },
          NetworkController: {
            ...mockNetworkState({
              id: 'sepolia',
              nickname: 'Sepolia',
              ticker: 'ETH',
              chainId: '0xaa36a7',
              type: RpcEndpointType.Infura,
            }),
          },
          AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
          AccountTrackerController: {
            accountsByChainId: {
              [MOCK_CHAIN_ID]: {
                [MOCK_ADDRESS_2]: { balance: '0x1' },
              },
            },
            // TODO: Replace "any" with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      },
    } as unknown as RootState);
    expect(result).toBeUndefined();
  });
});

describe('accountTrackerController selector memoization', () => {
  const buildState = (
    accountsByChainId: Record<string, Record<string, { balance: string }>>,
    selectedAccount = MOCK_ACCOUNTS_CONTROLLER_STATE.internalAccounts
      .selectedAccount,
  ) =>
    ({
      engine: {
        backgroundState: {
          NetworkController: {
            ...mockNetworkState({
              chainId: MOCK_CHAIN_ID,
              id: 'mainnet',
              nickname: 'Ethereum Mainnet',
              ticker: 'ETH',
            }),
          },
          AccountsController: {
            ...MOCK_ACCOUNTS_CONTROLLER_STATE,
            internalAccounts: {
              ...MOCK_ACCOUNTS_CONTROLLER_STATE.internalAccounts,
              selectedAccount,
            },
          },
          AccountTrackerController: { accountsByChainId },
          MultichainNetworkController: {
            isEvmSelected: true,
            selectedMultichainNetworkChainId: SolScope.Mainnet,
            multichainNetworkConfigurationsByChainId: {},
          },
        },
      },
    } as unknown as RootState);

  const ACCOUNTS_BY_CHAIN_ID = {
    [MOCK_CHAIN_ID]: {
      [MOCK_ADDRESS_1]: { balance: '0x1' },
      [MOCK_ADDRESS_2]: { balance: '0x2' },
    },
    '0x89': {
      [MOCK_ADDRESS_2]: { balance: '0x3' },
    },
  };

  it('keeps references stable when the controller re-clones an unchanged map', () => {
    const first = buildState(ACCOUNTS_BY_CHAIN_ID);
    const second = buildState(cloneDeep(ACCOUNTS_BY_CHAIN_ID));

    expect(selectAccountsByChainId(second)).toBe(
      selectAccountsByChainId(first),
    );
    expect(selectAccounts(second)).toBe(selectAccounts(first));
    expect(selectAccountBalanceByChainId(second)).toBe(
      selectAccountBalanceByChainId(first),
    );
  });

  it('keeps the selected balance reference when only another balance changes', () => {
    const first = buildState(ACCOUNTS_BY_CHAIN_ID);
    const changed = cloneDeep(ACCOUNTS_BY_CHAIN_ID);
    changed[MOCK_CHAIN_ID][MOCK_ADDRESS_1].balance = '0x99';
    const second = buildState(changed);

    const firstBalance = selectAccountBalanceByChainId(first);
    expect(selectAccountsByChainId(second)).not.toBe(
      selectAccountsByChainId(first),
    );
    expect(selectAccountBalanceByChainId(second)).toBe(firstBalance);
    expect(selectAccounts(second)[MOCK_ADDRESS_1].balance).toBe('0x99');
  });

  it('keeps the current-chain accounts reference when only another chain changes', () => {
    const first = buildState(ACCOUNTS_BY_CHAIN_ID);
    const changed = cloneDeep(ACCOUNTS_BY_CHAIN_ID);
    changed['0x89'][MOCK_ADDRESS_2].balance = '0x77';
    const second = buildState(changed);

    const accounts = selectAccounts(first);
    expect(selectAccountsByChainId(second)).not.toBe(
      selectAccountsByChainId(first),
    );
    expect(selectAccounts(second)).toBe(accounts);
  });

  it('returns the new balance when the selected balance changes', () => {
    const first = buildState(ACCOUNTS_BY_CHAIN_ID);
    const changed = cloneDeep(ACCOUNTS_BY_CHAIN_ID);
    changed[MOCK_CHAIN_ID][MOCK_ADDRESS_2].balance = '0x42';
    const second = buildState(changed);

    expect(selectAccountBalanceByChainId(first)?.balance).toBe('0x2');
    expect(selectAccountBalanceByChainId(second)?.balance).toBe('0x42');
  });

  it('does not recompute selectAccounts when the selected account changes', () => {
    const first = buildState(ACCOUNTS_BY_CHAIN_ID);
    const second = buildState(ACCOUNTS_BY_CHAIN_ID, expectedUuid);

    const accounts = selectAccounts(first);
    const recomputations = selectAccounts.recomputations();

    expect(selectAccounts(second)).toBe(accounts);
    expect(selectAccounts.recomputations()).toBe(recomputations);
    expect(selectAccountBalanceByChainId(first)?.balance).toBe('0x2');
    expect(selectAccountBalanceByChainId(second)?.balance).toBe('0x1');
  });
});
