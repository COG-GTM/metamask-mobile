import { TransactionType } from '@metamask/transaction-controller';
import { swapsUtils } from '@metamask/swaps-controller';
import {
  APPROVE_FUNCTION_SIGNATURE,
  INCREASE_ALLOWANCE_SIGNATURE,
  SET_APPROVAL_FOR_ALL_SIGNATURE,
  TRANSFER_FUNCTION_SIGNATURE,
} from '../../../util/transactions';
import { getCachedENSName } from '../../../util/ENSUtils';
import {
  TX_CANCELLED,
  TX_CONFIRMED,
  TX_FAILED,
  TX_REJECTED,
  TX_SIGNED,
  TX_SUBMITTED,
  TX_UNAPPROVED,
} from '../../../constants/transaction';
import {
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  FilterableTransaction,
  SearchIndexContext,
} from './types';
import {
  applyActivityFilters,
  buildSearchIndex,
  buildSearchIndexMap,
  classifyTxStatus,
  classifyTxType,
  isActivityFilterActive,
  normalizeQuery,
  resolveDateRange,
} from './utils';

jest.mock('../../../util/ENSUtils', () => ({
  getCachedENSName: jest.fn(),
}));

const MAINNET = '0x1';
const SELECTED = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const TOKEN = '0x3333333333333333333333333333333333333333';

const mockGetCachedENSName = jest.mocked(getCachedENSName);

const tx = (
  overrides: Partial<FilterableTransaction> & {
    txParams?: Partial<FilterableTransaction['txParams']>;
  } = {},
): FilterableTransaction => ({
  id: 'tx-1',
  chainId: MAINNET,
  hash: '0xabcdef0123456789',
  status: TX_CONFIRMED,
  time: 1_700_000_000_000,
  ...overrides,
  txParams: {
    from: SELECTED,
    to: OTHER,
    ...overrides.txParams,
  },
});

const context: SearchIndexContext = {
  selectedAddress: SELECTED,
  tokenLabelsByAddress: { [TOKEN.toLowerCase()]: 'USDC USD Coin' },
  networkNamesByChainId: { [MAINNET]: 'Ethereum Mainnet' },
  typeLabels: {
    [ActivityTypeCategory.Send]: 'Send',
    [ActivityTypeCategory.Receive]: 'Receive',
    [ActivityTypeCategory.Swap]: 'Swap',
    [ActivityTypeCategory.Bridge]: 'Bridge',
    [ActivityTypeCategory.Approve]: 'Approve',
    [ActivityTypeCategory.ContractInteraction]: 'Contract interaction',
  },
};

beforeEach(() => {
  mockGetCachedENSName.mockReset();
  mockGetCachedENSName.mockReturnValue(undefined);
});

describe('classifyTxType', () => {
  it('classifies a bridge transaction', () => {
    expect(
      classifyTxType(tx({ type: TransactionType.bridge }), SELECTED),
    ).toBe(ActivityTypeCategory.Bridge);
  });

  it('classifies a swap by transaction type', () => {
    expect(classifyTxType(tx({ type: TransactionType.swap }), SELECTED)).toBe(
      ActivityTypeCategory.Swap,
    );
  });

  it('classifies a swap by the swaps contract address', () => {
    const swapsAddress = swapsUtils.getSwapsContractAddress(MAINNET);
    expect(
      classifyTxType(tx({ txParams: { to: swapsAddress } }), SELECTED),
    ).toBe(ActivityTypeCategory.Swap);
  });

  it.each([
    APPROVE_FUNCTION_SIGNATURE,
    INCREASE_ALLOWANCE_SIGNATURE,
    SET_APPROVAL_FOR_ALL_SIGNATURE,
  ])('classifies %s as an approval', (signature) => {
    expect(
      classifyTxType(tx({ txParams: { data: `${signature}0000` } }), SELECTED),
    ).toBe(ActivityTypeCategory.Approve);
  });

  it('classifies an outgoing token transfer as send', () => {
    expect(
      classifyTxType(
        tx({
          isTransfer: true,
          txParams: { from: SELECTED, to: OTHER },
        }),
        SELECTED,
      ),
    ).toBe(ActivityTypeCategory.Send);
  });

  it('classifies an incoming token transfer as receive', () => {
    expect(
      classifyTxType(
        tx({
          txParams: {
            from: OTHER,
            to: SELECTED,
            data: `${TRANSFER_FUNCTION_SIGNATURE}0000`,
          },
        }),
        SELECTED,
      ),
    ).toBe(ActivityTypeCategory.Receive);
  });

  it('classifies contract deployment as a contract interaction', () => {
    expect(
      classifyTxType(tx({ txParams: { to: undefined, data: '0xdead' } }), SELECTED),
    ).toBe(ActivityTypeCategory.ContractInteraction);
  });

  it('classifies unknown call data as a contract interaction', () => {
    expect(
      classifyTxType(tx({ txParams: { data: '0xdeadbeef' } }), SELECTED),
    ).toBe(ActivityTypeCategory.ContractInteraction);
  });

  it('classifies a plain incoming native transfer as receive', () => {
    expect(
      classifyTxType(tx({ txParams: { from: OTHER, to: SELECTED } }), SELECTED),
    ).toBe(ActivityTypeCategory.Receive);
  });

  it('falls back to contract interaction when the chain has no swaps contract', () => {
    expect(
      classifyTxType(
        tx({ chainId: '0x12345', txParams: { data: '0xdeadbeef' } }),
        SELECTED,
      ),
    ).toBe(ActivityTypeCategory.ContractInteraction);
  });
});

describe('classifyTxStatus', () => {
  it.each([TX_UNAPPROVED, TX_SIGNED, TX_SUBMITTED, 'pending'])(
    'maps %s to pending',
    (status) => {
      expect(classifyTxStatus(tx({ status }))).toBe(
        ActivityStatusCategory.Pending,
      );
    },
  );

  it.each([TX_FAILED, TX_REJECTED, TX_CANCELLED])(
    'maps %s to failed',
    (status) => {
      expect(classifyTxStatus(tx({ status }))).toBe(
        ActivityStatusCategory.Failed,
      );
    },
  );

  it('maps confirmed to confirmed', () => {
    expect(classifyTxStatus(tx({ status: TX_CONFIRMED }))).toBe(
      ActivityStatusCategory.Confirmed,
    );
  });
});

describe('buildSearchIndex', () => {
  it('indexes addresses in both casings, hash, network and type label', () => {
    const index = buildSearchIndex(tx(), context);

    expect(index).toContain(SELECTED.toLowerCase());
    expect(index).toContain(OTHER.toLowerCase());
    expect(index).toContain('0xabcdef0123456789');
    expect(index).toContain('ethereum mainnet');
    expect(index).toContain('send');
    expect(index).toBe(index.toLowerCase());
  });

  it('indexes a cached ENS name when one exists', () => {
    mockGetCachedENSName.mockImplementation((address) =>
      address === OTHER ? 'alice.eth' : undefined,
    );

    expect(buildSearchIndex(tx(), context)).toContain('alice.eth');
  });

  it('omits ENS when the cache misses', () => {
    expect(buildSearchIndex(tx(), context)).not.toContain('.eth');
  });

  it('indexes the token symbol and name of a transfer', () => {
    const index = buildSearchIndex(
      tx({
        isTransfer: true,
        transferInformation: { contractAddress: TOKEN, symbol: 'USDC' },
      }),
      context,
    );

    expect(index).toContain('usdc');
    expect(index).toContain('usd coin');
  });

  it('keys the index map by transaction id', () => {
    const map = buildSearchIndexMap([tx({ id: 'a' }), tx({ id: 'b' })], context);
    expect(Object.keys(map)).toEqual(['a', 'b']);
  });
});

describe('normalizeQuery', () => {
  it.each(['', ' ', 'a', '0x', ' 0X '])('ignores %p', (query) => {
    expect(normalizeQuery(query)).toBe('');
  });

  it('trims and lowercases a usable query', () => {
    expect(normalizeQuery('  AliCe ')).toBe('alice');
  });
});

describe('resolveDateRange', () => {
  const now = new Date(2026, 5, 15, 12, 0, 0).getTime();

  it('returns undefined when no range is set', () => {
    expect(resolveDateRange(undefined, now)).toBeUndefined();
  });

  it('resolves last 7 days to an inclusive 7 day window ending today', () => {
    const range = resolveDateRange(
      { preset: DateRangePreset.Last7Days },
      now,
    );

    expect(range?.startTime).toBe(new Date(2026, 5, 9, 0, 0, 0, 0).getTime());
    expect(range?.endTime).toBe(new Date(2026, 5, 15, 23, 59, 59, 999).getTime());
  });

  it('resolves this year from January 1st', () => {
    expect(
      resolveDateRange({ preset: DateRangePreset.ThisYear }, now)?.startTime,
    ).toBe(new Date(2026, 0, 1).getTime());
  });

  it('resolves a custom range inclusively, including start === end', () => {
    const day = new Date(2026, 2, 3, 15, 30).getTime();
    const range = resolveDateRange(
      { preset: DateRangePreset.Custom, startTime: day, endTime: day },
      now,
    );

    expect(range?.startTime).toBe(new Date(2026, 2, 3, 0, 0, 0, 0).getTime());
    expect(range?.endTime).toBe(
      new Date(2026, 2, 3, 23, 59, 59, 999).getTime(),
    );
  });

  it('returns undefined for a custom range with no bounds', () => {
    expect(
      resolveDateRange({ preset: DateRangePreset.Custom }, now),
    ).toBeUndefined();
  });
});

describe('isActivityFilterActive', () => {
  it('is false for the empty filter state', () => {
    expect(
      isActivityFilterActive({ query: '', types: [], statuses: [] }),
    ).toBe(false);
  });

  it('is false for a query below the minimum length', () => {
    expect(
      isActivityFilterActive({ query: 'a', types: [], statuses: [] }),
    ).toBe(false);
  });

  it('is true when any category is set', () => {
    expect(
      isActivityFilterActive({
        query: '',
        types: [ActivityTypeCategory.Swap],
        statuses: [],
      }),
    ).toBe(true);
  });
});

describe('applyActivityFilters', () => {
  const sent = tx({ id: 'sent', txParams: { from: SELECTED, to: OTHER } });
  const received = tx({
    id: 'received',
    status: TX_FAILED,
    time: new Date(2020, 0, 1).getTime(),
    txParams: { from: OTHER, to: SELECTED },
  });
  const approval = tx({
    id: 'approval',
    status: TX_SUBMITTED,
    txParams: { data: `${APPROVE_FUNCTION_SIGNATURE}00` },
  });
  const all = [sent, received, approval];
  const index = buildSearchIndexMap(all, context);
  const ids = (result: FilterableTransaction[]) => result.map(({ id }) => id);

  it('returns the input untouched when nothing is filtered', () => {
    const result = applyActivityFilters(
      all,
      { query: '', types: [], statuses: [] },
      index,
      SELECTED,
    );
    expect(result).toBe(all);
  });

  it('filters by search query only', () => {
    expect(
      ids(
        applyActivityFilters(
          all,
          { query: OTHER, types: [], statuses: [] },
          index,
          SELECTED,
        ),
      ),
    ).toEqual(['sent', 'received']);
  });

  it('filters by type only, OR-ing within the category', () => {
    expect(
      ids(
        applyActivityFilters(
          all,
          {
            query: '',
            types: [ActivityTypeCategory.Approve, ActivityTypeCategory.Receive],
            statuses: [],
          },
          index,
          SELECTED,
        ),
      ),
    ).toEqual(['received', 'approval']);
  });

  it('filters by status only', () => {
    expect(
      ids(
        applyActivityFilters(
          all,
          { query: '', types: [], statuses: [ActivityStatusCategory.Pending] },
          index,
          SELECTED,
        ),
      ),
    ).toEqual(['approval']);
  });

  it('filters by date only, inclusive of the bounds', () => {
    expect(
      ids(
        applyActivityFilters(
          all,
          {
            query: '',
            types: [],
            statuses: [],
            dateRange: {
              preset: DateRangePreset.Custom,
              startTime: new Date(2020, 0, 1).getTime(),
              endTime: new Date(2020, 0, 1).getTime(),
            },
          },
          index,
          SELECTED,
        ),
      ),
    ).toEqual(['received']);
  });

  it('ANDs across categories', () => {
    expect(
      ids(
        applyActivityFilters(
          all,
          {
            query: OTHER,
            types: [ActivityTypeCategory.Receive],
            statuses: [ActivityStatusCategory.Failed],
          },
          index,
          SELECTED,
        ),
      ),
    ).toEqual(['received']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(
      applyActivityFilters(
        all,
        { query: 'nothingmatchesthis', types: [], statuses: [] },
        index,
        SELECTED,
      ),
    ).toEqual([]);
  });

  it('preserves input ordering so pending stays pinned above confirmed', () => {
    const ordered = applyActivityFilters(
      [approval, sent, received],
      {
        query: '',
        types: [],
        statuses: [
          ActivityStatusCategory.Pending,
          ActivityStatusCategory.Confirmed,
          ActivityStatusCategory.Failed,
        ],
      },
      index,
      SELECTED,
    );

    expect(ids(ordered)).toEqual(['approval', 'sent', 'received']);
  });
});
