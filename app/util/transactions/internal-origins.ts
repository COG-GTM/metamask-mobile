import { v4 as uuidv4 } from 'uuid';
import { INTERNAL_ORIGINS } from '../../constants/transaction';

const SWAPS_ACTION_ID_PREFIX = 'mm-swaps-';
// Swaps transactions are classified right after creation, so only the most
// recent IDs need to be kept. Oldest IDs are evicted first.
export const MAX_INTERNAL_SWAPS_ACTION_IDS = 100;

// Action IDs issued in-process to the Swaps flow. Dapps cannot read or
// set TransactionController `actionId`, so membership here is the trust
// signal for Swaps transactions instead of the (forgeable) origin string.
const internalSwapsActionIds = new Set<string>();

/**
 * Returns true if the value matches an origin reserved for MetaMask itself
 * (Swaps, internal sends, etc). External requesters must never use these.
 */
export const isInternalOrigin = (value?: string | null): boolean =>
  typeof value === 'string' &&
  value.length > 0 &&
  INTERNAL_ORIGINS.some((internalOrigin) => internalOrigin === value);

/**
 * Creates an action ID that marks a transaction as created by the internal
 * Swaps flow. Pass it as `actionId` to `addTransaction`.
 */
export const createInternalSwapsActionId = (): string => {
  const actionId = `${SWAPS_ACTION_ID_PREFIX}${uuidv4()}`;
  internalSwapsActionIds.add(actionId);
  if (internalSwapsActionIds.size > MAX_INTERNAL_SWAPS_ACTION_IDS) {
    const [oldestActionId] = internalSwapsActionIds;
    internalSwapsActionIds.delete(oldestActionId);
  }
  return actionId;
};

/**
 * Returns true only for transactions created by the internal Swaps flow.
 */
export const isInternalSwapsTransaction = (
  origin?: string,
  actionId?: string,
): boolean =>
  Boolean(process.env.MM_FOX_CODE) &&
  origin === process.env.MM_FOX_CODE &&
  typeof actionId === 'string' &&
  internalSwapsActionIds.has(actionId);
