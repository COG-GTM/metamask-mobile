import { v4 as uuidv4 } from 'uuid';
import { INTERNAL_ORIGINS } from '../../constants/transaction';

const SWAPS_ACTION_ID_PREFIX = 'mm-swaps-';

// Swaps transactions are classified right after creation and again when
// published, so only the most recent IDs need to be kept.
export const MAX_SWAPS_ACTION_IDS = 100;

// Action IDs handed out in-process to the Swaps flow. Dapps can set the
// transaction origin (SDK originatorInfo, WalletConnect metadata) but have no
// way to set or read TransactionController `actionId`, so membership here is
// what proves a transaction was created by the Swaps screen.
const swapsActionIds = new Set<string>();

/**
 * Whether a value supplied by an external requester (page hostname, SDK
 * originatorInfo url/title, SDK channel id, WalletConnect metadata url)
 * collides with an origin reserved for wallet-internal flows.
 */
export const isInternalOrigin = (value?: unknown): boolean =>
  typeof value === 'string' &&
  value.length > 0 &&
  INTERNAL_ORIGINS.some((internalOrigin) => internalOrigin === value);

/**
 * Whether any identity field of an SDK `originatorInfo` claims an internal
 * origin.
 */
export const hasInternalOriginatorInfo = (
  originatorInfo?: { url?: unknown; title?: unknown } | null,
): boolean =>
  Boolean(originatorInfo) &&
  (isInternalOrigin(originatorInfo?.url) ||
    isInternalOrigin(originatorInfo?.title));

/**
 * Creates an action ID that marks a transaction as created by the Swaps
 * screen. Pass it as `actionId` to `addTransaction`.
 */
export const createSwapsActionId = (): string => {
  const actionId = `${SWAPS_ACTION_ID_PREFIX}${uuidv4()}`;
  swapsActionIds.add(actionId);
  if (swapsActionIds.size > MAX_SWAPS_ACTION_IDS) {
    const [oldestActionId] = swapsActionIds;
    swapsActionIds.delete(oldestActionId);
  }
  return actionId;
};

/**
 * Whether a transaction was created by the in-app Swaps flow. The origin alone
 * is not trusted: MM_FOX_CODE ships in the app bundle and external requesters
 * control the origin string.
 */
export const isSwapsFlowTransaction = (
  origin?: string,
  actionId?: string,
): boolean =>
  Boolean(process.env.MM_FOX_CODE) &&
  origin === process.env.MM_FOX_CODE &&
  typeof actionId === 'string' &&
  swapsActionIds.has(actionId);

/**
 * Whether a hex transaction value is empty or zero.
 */
export const isZeroTransactionValue = (value?: string): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && /^(0x)?0*$/i.test(value));
