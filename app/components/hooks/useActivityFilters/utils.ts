import { TransactionType } from '@metamask/transaction-controller';
import { swapsUtils } from '@metamask/swaps-controller';
import {
  APPROVE_FUNCTION_SIGNATURE,
  INCREASE_ALLOWANCE_SIGNATURE,
  SET_APPROVAL_FOR_ALL_SIGNATURE,
  TRANSFER_FROM_FUNCTION_SIGNATURE,
  TRANSFER_FUNCTION_SIGNATURE,
} from '../../../util/transactions';
import { safeToChecksumAddress } from '../../../util/address';
import { toLowerCaseEquals } from '../../../util/general';
import { getCachedENSName } from '../../../util/ENSUtils';
import {
  TX_CANCELLED,
  TX_CONFIRMED,
  TX_FAILED,
  TX_PENDING,
  TX_REJECTED,
  TX_SIGNED,
  TX_SUBMITTED,
  TX_UNAPPROVED,
} from '../../../constants/transaction';
import {
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
  DateRangePreset,
  FilterableTransaction,
  SearchIndexContext,
} from './types';

/** Queries shorter than this are ignored so the list does not thrash on the first keystroke. */
export const MIN_QUERY_LENGTH = 2;

const HEX_PREFIX = '0x';

const APPROVAL_SIGNATURES = [
  APPROVE_FUNCTION_SIGNATURE,
  INCREASE_ALLOWANCE_SIGNATURE,
  SET_APPROVAL_FOR_ALL_SIGNATURE,
];

const TRANSFER_SIGNATURES = [
  TRANSFER_FUNCTION_SIGNATURE,
  TRANSFER_FROM_FUNCTION_SIGNATURE,
];

const PENDING_STATUSES = [TX_UNAPPROVED, TX_SIGNED, TX_SUBMITTED, TX_PENDING];
const FAILED_STATUSES = [TX_FAILED, TX_REJECTED, TX_CANCELLED];

const hasSignature = (data: string | undefined, signatures: string[]) =>
  Boolean(data) && signatures.some((signature) => data?.startsWith(signature));

const getSwapsContractAddressSafely = (
  chainId: string | undefined,
): string | undefined => {
  if (!chainId) {
    return undefined;
  }
  try {
    return swapsUtils.getSwapsContractAddress(chainId);
  } catch {
    // Chain has no swaps contract; the transaction simply is not a swap.
    return undefined;
  }
};

/**
 * Classifies a transaction into the category shown on its row, synchronously.
 *
 * This mirrors `getActionKey` but never awaits: `getActionKey` resolves method
 * data over the network, which cannot happen on the filter path.
 */
export const classifyTxType = (
  tx: FilterableTransaction,
  selectedAddress: string,
): ActivityTypeCategory => {
  const { type, chainId, isTransfer } = tx;
  const { from, to, data } = tx.txParams ?? {};

  if (type === TransactionType.bridge || type === TransactionType.bridgeApproval) {
    return ActivityTypeCategory.Bridge;
  }

  if (type === TransactionType.swap || type === TransactionType.swapApproval) {
    return ActivityTypeCategory.Swap;
  }

  if (to && toLowerCaseEquals(to, getSwapsContractAddressSafely(chainId))) {
    return ActivityTypeCategory.Swap;
  }

  if (hasSignature(data, APPROVAL_SIGNATURES)) {
    return ActivityTypeCategory.Approve;
  }

  const isIncoming = toLowerCaseEquals(
    safeToChecksumAddress(to),
    selectedAddress,
  );
  const isOutgoing = toLowerCaseEquals(
    safeToChecksumAddress(from),
    selectedAddress,
  );

  if (isTransfer || hasSignature(data, TRANSFER_SIGNATURES)) {
    return isOutgoing
      ? ActivityTypeCategory.Send
      : ActivityTypeCategory.Receive;
  }

  if (!to) {
    return ActivityTypeCategory.ContractInteraction;
  }

  if (data && data !== HEX_PREFIX) {
    return ActivityTypeCategory.ContractInteraction;
  }

  if (isIncoming && !isOutgoing) {
    return ActivityTypeCategory.Receive;
  }

  return ActivityTypeCategory.Send;
};

export const classifyTxStatus = (
  tx: FilterableTransaction,
): ActivityStatusCategory => {
  if (PENDING_STATUSES.includes(tx.status)) {
    return ActivityStatusCategory.Pending;
  }
  if (FAILED_STATUSES.includes(tx.status)) {
    return ActivityStatusCategory.Failed;
  }
  if (tx.status === TX_CONFIRMED) {
    return ActivityStatusCategory.Confirmed;
  }
  return ActivityStatusCategory.Confirmed;
};

/**
 * Builds the lowercase haystack a search query is matched against. ENS names
 * are read from the reverse-lookup cache only — the filter path never triggers
 * a lookup — so ENS matching is best effort and mainnet only.
 */
export const buildSearchIndex = (
  tx: FilterableTransaction,
  context: SearchIndexContext,
): string => {
  const { from, to } = tx.txParams ?? {};
  const parts: (string | undefined)[] = [
    from,
    to,
    safeToChecksumAddress(from),
    safeToChecksumAddress(to),
    tx.hash,
    tx.chainId && from ? getCachedENSName(from, tx.chainId) : undefined,
    tx.chainId && to ? getCachedENSName(to, tx.chainId) : undefined,
    tx.transferInformation?.symbol,
    to ? context.tokenLabelsByAddress[to.toLowerCase()] : undefined,
    tx.transferInformation?.contractAddress
      ? context.tokenLabelsByAddress[
          tx.transferInformation.contractAddress.toLowerCase()
        ]
      : undefined,
    context.typeLabels[classifyTxType(tx, context.selectedAddress)],
    tx.chainId ? context.networkNamesByChainId[tx.chainId] : undefined,
  ];

  return parts
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase();
};

export const buildSearchIndexMap = (
  transactions: FilterableTransaction[],
  context: SearchIndexContext,
): Record<string, string> =>
  transactions.reduce<Record<string, string>>((acc, tx) => {
    acc[tx.id] = buildSearchIndex(tx, context);
    return acc;
  }, {});

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const endOfDay = (date: Date): number =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

/**
 * Resolves a date range filter to inclusive epoch millisecond bounds in the
 * device timezone. Returns undefined when the range does not constrain.
 */
export const resolveDateRange = (
  dateRange: ActivityFilterState['dateRange'],
  now: number = Date.now(),
): { startTime: number; endTime: number } | undefined => {
  if (!dateRange) {
    return undefined;
  }

  const nowDate = new Date(now);
  const daysAgo = (days: number) =>
    startOfDay(new Date(now - (days - 1) * 24 * 60 * 60 * 1000));

  switch (dateRange.preset) {
    case DateRangePreset.Last7Days:
      return { startTime: daysAgo(7), endTime: endOfDay(nowDate) };
    case DateRangePreset.Last30Days:
      return { startTime: daysAgo(30), endTime: endOfDay(nowDate) };
    case DateRangePreset.Last90Days:
      return { startTime: daysAgo(90), endTime: endOfDay(nowDate) };
    case DateRangePreset.ThisYear:
      return {
        startTime: new Date(nowDate.getFullYear(), 0, 1).getTime(),
        endTime: endOfDay(nowDate),
      };
    case DateRangePreset.Custom: {
      if (dateRange.startTime === undefined && dateRange.endTime === undefined) {
        return undefined;
      }
      return {
        startTime:
          dateRange.startTime === undefined
            ? Number.NEGATIVE_INFINITY
            : startOfDay(new Date(dateRange.startTime)),
        endTime:
          dateRange.endTime === undefined
            ? Number.POSITIVE_INFINITY
            : endOfDay(new Date(dateRange.endTime)),
      };
    }
    default:
      return undefined;
  }
};

export const normalizeQuery = (query: string): string => {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < MIN_QUERY_LENGTH || trimmed === HEX_PREFIX) {
    return '';
  }
  return trimmed;
};

export const isActivityFilterActive = (filters: ActivityFilterState): boolean =>
  Boolean(normalizeQuery(filters.query)) ||
  filters.types.length > 0 ||
  filters.statuses.length > 0 ||
  Boolean(resolveDateRange(filters.dateRange));

/**
 * Applies search, type, status and date filters to a list of transactions.
 * Categories combine with AND; selections within a category combine with OR.
 */
export const applyActivityFilters = (
  transactions: FilterableTransaction[],
  filters: ActivityFilterState,
  searchIndex: Record<string, string>,
  selectedAddress: string,
  now: number = Date.now(),
): FilterableTransaction[] => {
  const query = normalizeQuery(filters.query);
  const range = resolveDateRange(filters.dateRange, now);

  if (
    !query &&
    filters.types.length === 0 &&
    filters.statuses.length === 0 &&
    !range
  ) {
    return transactions;
  }

  return transactions.filter((tx) => {
    if (query && !(searchIndex[tx.id] ?? '').includes(query)) {
      return false;
    }

    if (
      filters.types.length > 0 &&
      !filters.types.includes(classifyTxType(tx, selectedAddress))
    ) {
      return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(classifyTxStatus(tx))
    ) {
      return false;
    }

    if (range && (tx.time < range.startTime || tx.time > range.endTime)) {
      return false;
    }

    return true;
  });
};
