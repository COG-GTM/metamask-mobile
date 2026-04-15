import { useSelector } from 'react-redux';
import { selectBridgeHistoryForAccount } from '../../../../../selectors/bridgeStatusController';

import { useMemo } from 'react';

/**
 * This hook is used to get the bridge history item by source transaction hash.
 * It is used to get the bridge history item for the non EVM transactions.
 */
export const useBridgeHistoryItemBySrcTxHash = () => {
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  // Create a lookup map for faster access to bridge history items by source transaction hash.
  const bridgeHistoryItemsBySrcTxHash =
  useMemo(() => {
    const bridgeHistoryItemsBySrcTxHash_ =
    {};

    Object.values(bridgeHistory ?? {}).forEach((bridgeTx) => {
      const txHash = bridgeTx.status?.srcChain?.txHash;
      if (txHash) {
        bridgeHistoryItemsBySrcTxHash_[txHash] = bridgeTx;
      }
    });

    return bridgeHistoryItemsBySrcTxHash_;
  }, [bridgeHistory]);

  return {
    bridgeHistoryItemsBySrcTxHash
  };
};