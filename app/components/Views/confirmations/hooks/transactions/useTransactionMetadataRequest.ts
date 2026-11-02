import { useEffect } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import Engine from '../../../../../core/Engine';
import { selectTransactionMetadataById } from '../../../../../selectors/transactionController';
import { RootState } from '../../../../UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test';
import useApprovalRequest from '../useApprovalRequest';

// Number of mounted hook instances per chainId. A single confirmation screen
// mounts many instances of this hook, so the token list is only fetched when
// the first instance for a chainId mounts.
const mountedInstancesByChainId = new Map<Hex, number>();

function useFetchTokenListOnce(chainId?: Hex) {
  useEffect(() => {
    if (!chainId) {
      return undefined;
    }

    const mountedInstances = mountedInstancesByChainId.get(chainId) ?? 0;
    mountedInstancesByChainId.set(chainId, mountedInstances + 1);

    if (mountedInstances === 0) {
      Engine.context.TokenListController.fetchTokenList(chainId);
    }

    return () => {
      const remaining = (mountedInstancesByChainId.get(chainId) ?? 1) - 1;
      if (remaining > 0) {
        mountedInstancesByChainId.set(chainId, remaining);
      } else {
        mountedInstancesByChainId.delete(chainId);
      }
    };
  }, [chainId]);
}

export function useTransactionMetadataRequest() {
  const { approvalRequest } = useApprovalRequest();

  const transactionMetadata = useSelector((state: RootState) =>
    selectTransactionMetadataById(state, approvalRequest?.id as string),
  );

  // TODO: This is a temporary solution to force token list to be fetched for chainId of
  // transaction in order to get proper display names for simulation details.
  // We may remove this once we have a better way to single token information.
  useFetchTokenListOnce(transactionMetadata?.chainId);

  if (
    approvalRequest?.type === ApprovalType.Transaction &&
    !transactionMetadata
  ) {
    return undefined;
  }

  return transactionMetadata as TransactionMeta;
}
