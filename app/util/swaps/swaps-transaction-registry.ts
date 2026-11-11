import { v4 as uuidv4 } from 'uuid';
import { Hex } from '@metamask/utils';
import { getIsSwapApproveOrSwapTransaction } from '../transactions';

/**
 * Action IDs of transactions created by the in-app swaps flow.
 * Only transactions registered here may skip the confirmation screen,
 * because the transaction origin string can be set by external dapps.
 */
const swapsActionIds = new Set<string>();

export function createSwapsActionId(): string {
  const actionId = uuidv4();
  swapsActionIds.add(actionId);
  return actionId;
}

export function releaseSwapsActionId(actionId: string) {
  swapsActionIds.delete(actionId);
}

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
