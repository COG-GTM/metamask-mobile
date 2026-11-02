import { useEffect } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import Engine from '../../../../../core/Engine';
import { selectTransactionMetadataById } from '../../../../../selectors/transactionController';
import { RootState } from '../../../../UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test';
import useApprovalRequest from '../useApprovalRequest';

// Number of mounted hook instances per transaction and chainId.
const mountedInstancesByKey = new Map<string, number>();

/**
 * Fetches the token list for a transaction's chain once per confirmation.
 *
 * A single confirmation screen mounts many instances of
 * `useTransactionMetadataRequest`, so only the first mounted instance for a
 * given transaction and chain calls `TokenListController.fetchTokenList`.
 * The fetch runs again for a new transaction (e.g. the next queued approval),
 * or once all instances have unmounted.
 *
 * @param transactionId - ID of the transaction being confirmed.
 * @param chainId - Chain ID of the transaction being confirmed.
 */
function useFetchTokenListOnce(transactionId?: string, chainId?: Hex) {
  useEffect(() => {
    if (!chainId) {
      return undefined;
    }

    const key = `${transactionId}:${chainId}`;
    const mountedInstances = mountedInstancesByKey.get(key) ?? 0;
    mountedInstancesByKey.set(key, mountedInstances + 1);

    if (mountedInstances === 0) {
      Engine.context.TokenListController.fetchTokenList(chainId);
    }

    return () => {
      const remaining = (mountedInstancesByKey.get(key) ?? 1) - 1;
      if (remaining > 0) {
        mountedInstancesByKey.set(key, remaining);
      } else {
        mountedInstancesByKey.delete(key);
      }
    };
  }, [transactionId, chainId]);
}

export function useTransactionMetadataRequest() {
  const { approvalRequest } = useApprovalRequest();

  const transactionMetadata = useSelector((state: RootState) =>
    selectTransactionMetadataById(state, approvalRequest?.id as string),
  );

  // TODO: This is a temporary solution to force token list to be fetched for chainId of
  // transaction in order to get proper display names for simulation details.
  // We may remove this once we have a better way to single token information.
  useFetchTokenListOnce(transactionMetadata?.id, transactionMetadata?.chainId);

  if (
    approvalRequest?.type === ApprovalType.Transaction &&
    !transactionMetadata
  ) {
    return undefined;
  }

  return transactionMetadata as TransactionMeta;
}
