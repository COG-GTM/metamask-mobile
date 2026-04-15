import { merge } from 'lodash';

import { TRANSACTION_EVENTS } from '../../../../Analytics/events/confirmations';

import { selectShouldUseSmartTransaction } from '../../../../../selectors/smartTransactionsController';
import { getSmartTransactionMetricsProperties } from '../../../../../util/smart-transactions';
import { MetaMetrics } from '../../../../Analytics';

import { generateDefaultTransactionMetrics, generateEvent } from '../utils';


// Generic handler for simple transaction events
const createTransactionEventHandler =
(eventType) =>
(
transactionMeta,
transactionEventHandlerRequest) =>
{
  const defaultTransactionMetricProperties =
  generateDefaultTransactionMetrics(
    eventType,
    transactionMeta,
    transactionEventHandlerRequest
  );

  const event = generateEvent(defaultTransactionMetricProperties);
  MetaMetrics.getInstance().trackEvent(event);
};

// Simple handlers - no unique properties / actions
export const handleTransactionAddedEventForMetrics = createTransactionEventHandler(
  TRANSACTION_EVENTS.TRANSACTION_ADDED
);
export const handleTransactionApprovedEventForMetrics = createTransactionEventHandler(
  TRANSACTION_EVENTS.TRANSACTION_APPROVED
);
export const handleTransactionRejectedEventForMetrics = createTransactionEventHandler(
  TRANSACTION_EVENTS.TRANSACTION_REJECTED
);
export const handleTransactionSubmittedEventForMetrics = createTransactionEventHandler(
  TRANSACTION_EVENTS.TRANSACTION_SUBMITTED
);

// Intentionally using TRANSACTION_FINALIZED for confirmed/failed/dropped transactions
// as unified type for all finalized transactions.
// Status could be derived from transactionMeta.status
export async function handleTransactionFinalizedEventForMetrics(
transactionMeta,
transactionEventHandlerRequest)
{
  const { getState, initMessenger, smartTransactionsController } =
  transactionEventHandlerRequest;

  const defaultTransactionMetricProperties = generateDefaultTransactionMetrics(
    TRANSACTION_EVENTS.TRANSACTION_FINALIZED,
    transactionMeta,
    transactionEventHandlerRequest
  );

  let stxMetricsProperties = {};

  const shouldUseSmartTransaction = selectShouldUseSmartTransaction(getState(), transactionMeta.chainId);
  if (shouldUseSmartTransaction) {
    stxMetricsProperties = await getSmartTransactionMetricsProperties(
      smartTransactionsController,
      transactionMeta,
      true,
      initMessenger
    );
  }

  const mergedEventProperties = merge(
    {
      properties: stxMetricsProperties
    },
    defaultTransactionMetricProperties
  );

  const event = generateEvent(mergedEventProperties);

  MetaMetrics.getInstance().trackEvent(event);
}