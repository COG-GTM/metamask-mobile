import { TransactionType } from '@metamask/transaction-controller';
import {
  TX_CONFIRMED,
  TX_FAILED,
  TX_SUBMITTED,
} from '../../../constants/transaction';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  EMPTY_ACTIVITY_FILTER_STATE,
  FilterableTransaction,
  SearchIndexContext,
} from './types';
import { applyActivityFilters, buildSearchIndexMap } from './utils';

/**
 * The PRD budget is one frame (16 ms) on a mid-range Android device for a
 * 1,000 transaction list. CI runners are shared and far less predictable than
 * a phone, so the assertions below allow an order of magnitude of headroom:
 * they exist to catch an accidental O(n^2) or a per-keystroke index rebuild,
 * not to police single-digit millisecond drift.
 */
const TRANSACTION_COUNT = 1000;
const FILTER_BUDGET_MS = 160;
const INDEX_BUDGET_MS = 500;

const SELECTED_ADDRESS = '0x1111111111111111111111111111111111111111';
const COUNTERPARTY = '0x2222222222222222222222222222222222222222';
const TOKEN_ADDRESS = '0x3333333333333333333333333333333333333333';

const STATUSES = [TX_CONFIRMED, TX_SUBMITTED, TX_FAILED];
const CHAIN_IDS = ['0x1', '0x89', '0xe708'];

const DAY_MS = 24 * 60 * 60 * 1000;

const context: SearchIndexContext = {
  selectedAddress: SELECTED_ADDRESS,
  tokenLabelsByAddress: { [TOKEN_ADDRESS]: 'USDC USD Coin' },
  networkNamesByChainId: {
    '0x1': 'Ethereum Mainnet',
    '0x89': 'Polygon',
    '0xe708': 'Linea',
  },
  typeLabels: {
    [ActivityTypeCategory.Send]: 'Send',
    [ActivityTypeCategory.Receive]: 'Receive',
    [ActivityTypeCategory.Swap]: 'Swap',
    [ActivityTypeCategory.Bridge]: 'Bridge',
    [ActivityTypeCategory.Approve]: 'Approve',
    [ActivityTypeCategory.ContractInteraction]: 'Contract interaction',
  },
};

const TYPES = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.swap,
  TransactionType.bridge,
  TransactionType.tokenMethodApprove,
  TransactionType.contractInteraction,
];

const buildTransactions = (
  count: number,
  now: number,
): FilterableTransaction[] =>
  Array.from({ length: count }, (_unused, index) => {
    const isOutgoing = index % 2 === 0;
    return {
      id: `tx-${index}`,
      chainId: CHAIN_IDS[index % CHAIN_IDS.length],
      hash: `0x${index.toString(16).padStart(64, 'a')}`,
      status: STATUSES[index % STATUSES.length],
      time: now - index * (DAY_MS / 8),
      type: TYPES[index % TYPES.length],
      isTransfer: index % 3 === 0,
      transferInformation: {
        contractAddress: TOKEN_ADDRESS,
        symbol: index % 2 === 0 ? 'USDC' : 'DAI',
        decimals: 18,
      },
      txParams: {
        from: isOutgoing ? SELECTED_ADDRESS : COUNTERPARTY,
        to: isOutgoing ? COUNTERPARTY : SELECTED_ADDRESS,
        data: '0x',
      },
    };
  });

const measure = (label: string, run: () => void): number => {
  // One warm-up pass so JIT compilation is not attributed to the measurement.
  run();
  const started = Date.now();
  run();
  const elapsed = Date.now() - started;
  // eslint-disable-next-line no-console
  console.log(`[activity-filters perf] ${label}: ${elapsed} ms`);
  return elapsed;
};

describe('activity filter performance', () => {
  const now = Date.UTC(2025, 0, 15);
  const transactions = buildTransactions(TRANSACTION_COUNT, now);
  const searchIndex = buildSearchIndexMap(transactions, context);

  const filterCases: [string, ActivityFilterState][] = [
    ['search only', { ...EMPTY_ACTIVITY_FILTER_STATE, query: 'usdc' }],
    [
      'type only',
      {
        ...EMPTY_ACTIVITY_FILTER_STATE,
        types: [ActivityTypeCategory.Swap, ActivityTypeCategory.Send],
      },
    ],
    [
      'search + type + status + date',
      {
        query: 'polygon',
        types: [ActivityTypeCategory.Send, ActivityTypeCategory.Approve],
        statuses: [ActivityStatusCategory.Confirmed],
        dateRange: { preset: DateRangePreset.Last30Days },
      },
    ],
  ];

  it.each(filterCases)(
    'filters %s over 1,000 transactions within budget',
    (label, filters) => {
      let filtered: FilterableTransaction[] = [];
      const elapsed = measure(label, () => {
        filtered = applyActivityFilters(
          transactions,
          filters,
          searchIndex,
          SELECTED_ADDRESS,
          now,
        );
      });

      expect(filtered.length).toBeLessThanOrEqual(TRANSACTION_COUNT);
      expect(elapsed).toBeLessThan(FILTER_BUDGET_MS);
    },
  );

  it('builds the search index for 1,000 transactions within budget', () => {
    let index: Record<string, string> = {};
    const elapsed = measure('index build', () => {
      index = buildSearchIndexMap(transactions, context);
    });

    expect(Object.keys(index)).toHaveLength(TRANSACTION_COUNT);
    expect(elapsed).toBeLessThan(INDEX_BUDGET_MS);
  });

  it('scales linearly rather than quadratically with list size', () => {
    const small = buildTransactions(250, now);
    const smallIndex = buildSearchIndexMap(small, context);
    const filters: ActivityFilterState = {
      ...EMPTY_ACTIVITY_FILTER_STATE,
      query: 'usdc',
    };

    const smallElapsed =
      measure('250 txs', () => {
        applyActivityFilters(small, filters, smallIndex, SELECTED_ADDRESS, now);
      }) + 1;
    const largeElapsed =
      measure('1000 txs', () => {
        applyActivityFilters(
          transactions,
          filters,
          searchIndex,
          SELECTED_ADDRESS,
          now,
        );
      }) + 1;

    // 4x the rows should not cost anywhere near 16x the time.
    expect(largeElapsed / smallElapsed).toBeLessThan(16);
  });
});
