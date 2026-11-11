import { v4 as uuidv4 } from 'uuid';
import { Hex } from '@metamask/utils';
import { getIsSwapApproveOrSwapTransaction } from '../transactions';

/**
 * Action IDs of transactions created by the in-app swaps flow.
 * Only transactions registered here may skip the confirmation screen,
 * because the transaction origin string can be set by external dapps.
 */
const swapsActionIds = new Set<string>();

/**
 * Registers a new action ID for a transaction about to be added by the swaps flow.
 *
 * @returns The action ID to pass to `addTransaction`.
 */
export function createSwapsActionId(): string {
  const actionId = uuidv4();
  swapsActionIds.add(actionId);
  return actionId;
}

/**
 * Removes an action ID from the registry, e.g. once `addTransaction` has returned.
 *
 * @param actionId - The action ID returned by `createSwapsActionId`.
 */
export function releaseSwapsActionId(actionId: string) {
  swapsActionIds.delete(actionId);
}

/**
 * Checks whether an action ID is registered and removes it so it can only be used once.
 *
 * @param actionId - The action ID stored on the transaction.
 * @returns Whether the action ID was registered.
 */
function consumeSwapsActionId(actionId?: string): boolean {
  if (!actionId || !swapsActionIds.has(actionId)) {
    return false;
  }
  swapsActionIds.delete(actionId);
  return true;
}

interface AutoSignCandidate {
  actionId?: string;
  origin?: string;
  txParams: {
    to?: string;
    data?: string;
  };
}

/**
 * Determines whether a transaction is a swaps approve/trade transaction created by the
 * in-app swaps flow, and can therefore skip the confirmation screen.
 *
 * @param transactionMeta - The unapproved transaction.
 * @param chainId - The current chain ID.
 * @returns Whether the transaction should be auto-signed.
 */
export function shouldAutoSignSwapsTransaction(
  transactionMeta: AutoSignCandidate,
  chainId: Hex,
): boolean {
  const to = transactionMeta.txParams.to?.toLowerCase();
  const { data } = transactionMeta.txParams;

  return Boolean(
    getIsSwapApproveOrSwapTransaction(
      data,
      transactionMeta.origin,
      to,
      chainId,
    ) && consumeSwapsActionId(transactionMeta.actionId),
  );
}
