import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
import { createSelector } from 'reselect';

import { selectGasFeeControllerEstimates } from './gasFeeController';
import { selectTransactions } from './transactionController';
import { createDeepEqualSelector } from './util';

const selectCurrentTransactionId = (state) => state.transaction?.id;

export const selectCurrentTransactionSecurityAlertResponse = (
state) =>
{
  const { id, securityAlertResponses } = state.transaction;
  return securityAlertResponses?.[id];
};

export const selectCurrentTransactionMetadata = createSelector(
  selectTransactions,
  selectCurrentTransactionId,
  (transactions, currentTransactionId) =>
  transactions.find((tx) => tx.id === currentTransactionId)
);

const selectCurrentTransactionGasFeeEstimatesStrict = createSelector(
  selectCurrentTransactionMetadata,
  (transactionMetadata) => transactionMetadata?.gasFeeEstimates
);

export const selectCurrentTransactionGasFeeEstimates = createDeepEqualSelector(
  selectCurrentTransactionGasFeeEstimatesStrict,
  (gasFeeEstimates) => gasFeeEstimates
);

export const selectGasFeeEstimates = createSelector(
  selectGasFeeControllerEstimates,
  selectCurrentTransactionGasFeeEstimates,
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gasFeeControllerEstimates: gasFeeControllerEstimates,
        transactionGasFeeEstimates
      });
    }

    return gasFeeControllerEstimates;
  }
);