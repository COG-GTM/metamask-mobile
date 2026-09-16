import { renderHook, act } from '@testing-library/react-hooks';
import { KeyringTypes } from '@metamask/keyring-controller';
import { toChecksumAddress } from 'ethereumjs-util';
import useAccounts from './useAccounts';
import { backgroundState } from '../../../util/test/initial-root-state';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import { Account } from './useAccounts.types';
import { Hex } from '@metamask/utils';
// eslint-disable-next-line import/no-namespace
import * as networks from '../../../util/networks';
import { doENSReverseLookup } from '../../../util/ENSUtils';
import { useMultichainBalancesForAllAccounts } from '../useMultichainBalances';

jest.mock('../../../core/Engine', () => ({
  getTotalEvmFiatAccountBalance: jest.fn().mockReturnValue({
    ethFiat: 0,
    ethFiat1dAgo: 0,
    tokenFiat: 0,
    tokenFiat1dAgo: 0,
    totalNativeTokenBalance: '0',
    ticker: 'ETH',
  }),
}));

const MOCK_ENS_CACHED_NAME = 'fox.eth';

const MOCK_CHAIN_ID = '0x1';

const MOCK_ACCOUNT_ADDRESSES = Object.values(
  MOCK_ACCOUNTS_CONTROLLER_STATE.internalAccounts.accounts,
).map((account) => account.address);

const MOCK_ACCOUNT_1: Account = {
  name: 'Account 1',
  address: toChecksumAddress(MOCK_ACCOUNT_ADDRESSES[0]) as Hex,
  type: KeyringTypes.hd,
  yOffset: 0,
  isSelected: false,
  assets: {
    fiatBalance: '$0.00\n0 ETH',
  },
  balanceError: undefined,
};
const MOCK_ACCOUNT_2: Account = {
  name: 'Account 2',
  address: toChecksumAddress(MOCK_ACCOUNT_ADDRESSES[1]) as Hex,
  type: KeyringTypes.hd,
  yOffset: 78,
  isSelected: true,
  assets: {
    fiatBalance: '$0.00\n0 ETH',
  },
  balanceError: undefined,
};

const MOCK_STORE_STATE = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': {
            [MOCK_ACCOUNT_1.address]: {
              balance: '0x0',
            },
            [MOCK_ACCOUNT_2.address]: {
              balance: '0x5',
            },
          },
        },
      },
    },
  },
};

jest.mock('../../../util/ENSUtils', () => ({
  ...jest.requireActual('../../../util/ENSUtils'),
  doENSReverseLookup: jest
    .fn()
    .mockImplementation((address: string, chainId: string) => {
      const cacheKey = `${chainId}${address}`;
      const MOCK_ENS_CACHE = {
        [`${MOCK_CHAIN_ID}${MOCK_ACCOUNT_1.address}`]: MOCK_ENS_CACHED_NAME,
      };
      return MOCK_ENS_CACHE[cacheKey];
    }),
}));

jest.mock('../useMultichainBalances', () => {
  const actual = jest.requireActual('../useMultichainBalances');
  return {
    ...actual,
    useMultichainBalancesForAllAccounts: jest
      .fn()
      .mockImplementation(actual.useMultichainBalancesForAllAccounts),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (fn: (state: unknown) => unknown) => fn(MOCK_STORE_STATE),
}));

describe('useAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty data if isLoading is true', async () => {
    const { result } = renderHook(() => useAccounts({ isLoading: true }));
    expect(result.current.accounts).toStrictEqual([]);
    expect(result.current.ensByAccountAddress).toStrictEqual({});
  });

  it('populates balanceError property for accounts', async () => {
    const expectedBalanceError = 'Insufficient funds';
    const { result, waitForNextUpdate } = renderHook(() =>
      useAccounts({
        checkBalanceError: (balance) =>
          balance === '0' ? 'Insufficient funds' : '',
      }),
    );
    await act(async () => {
      await waitForNextUpdate();
    });
    expect(result.current.accounts[0].balanceError).toStrictEqual(
      expectedBalanceError,
    );
  });

  it('returns internal accounts', async () => {
    jest.spyOn(networks, 'isPortfolioViewEnabled').mockReturnValue(false);
    const expectedInternalAccounts: Account[] = [
      MOCK_ACCOUNT_1,
      MOCK_ACCOUNT_2,
    ];
    const { result, waitForNextUpdate } = renderHook(() => useAccounts());
    await act(async () => {
      await waitForNextUpdate();
    });
    expect(result.current.accounts).toStrictEqual(expectedInternalAccounts);
  });

  it('returns ENS name when available', async () => {
    const expectedENSNames = {
      [MOCK_ACCOUNT_1.address]: MOCK_ENS_CACHED_NAME,
    };
    const { result, waitForNextUpdate } = renderHook(() => useAccounts());
    await act(async () => {
      await waitForNextUpdate();
    });
    expect(result.current.ensByAccountAddress).toStrictEqual(expectedENSNames);
  });

  it('does not re-run ENS lookups when only balances change', async () => {
    const mockedUseBalances = jest.mocked(useMultichainBalancesForAllAccounts);
    const buildBalances = (fiat: number) => ({
      multichainBalancesForAllAccounts: Object.fromEntries(
        Object.values(
          MOCK_ACCOUNTS_CONTROLLER_STATE.internalAccounts.accounts,
        ).map((account) => [
          account.id,
          {
            displayBalance: `$${fiat}.00`,
            displayCurrency: 'usd',
            totalFiatBalance: fiat,
            totalNativeTokenBalance: '0',
            nativeTokenUnit: 'ETH',
            tokenFiatBalancesCrossChains: [],
            shouldShowAggregatedPercentage: false,
            isPortfolioVieEnabled: false,
            aggregatedBalance: {
              ethFiat: fiat,
              tokenFiat: 0,
              tokenFiat1dAgo: 0,
              ethFiat1dAgo: 0,
            },
          },
        ]),
      ),
    });
    let balances = buildBalances(1);
    mockedUseBalances.mockImplementation(() => balances);

    const { result, rerender, waitForNextUpdate } = renderHook(() =>
      useAccounts(),
    );
    await act(async () => {
      await waitForNextUpdate();
    });
    const lookupsAfterMount = jest.mocked(doENSReverseLookup).mock.calls.length;
    expect(lookupsAfterMount).toBe(MOCK_ACCOUNT_ADDRESSES.length);

    // Simulate a balance poll producing a new balances object reference.
    balances = buildBalances(2);
    await act(async () => {
      rerender();
    });

    expect(result.current.accounts[0].assets?.fiatBalance).toContain('$2.00');
    expect(doENSReverseLookup).toHaveBeenCalledTimes(lookupsAfterMount);

    mockedUseBalances.mockImplementation(
      jest.requireActual('../useMultichainBalances')
        .useMultichainBalancesForAllAccounts,
    );
  });
});
