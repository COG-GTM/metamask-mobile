import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '@metamask/smart-transactions-controller/dist/constants';
import {
  getSmartTransactionMetricsProperties as getSmartTransactionMetricsPropertiesType,
  getSmartTransactionMetricsSensitiveProperties as getSmartTransactionMetricsSensitivePropertiesType,
} from '@metamask/smart-transactions-controller/dist/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../constants/smartTransactions';
import { selectSwapsChainFeatureFlags } from '../../../../reducers/swaps';
import { MetaMetrics } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { store } from '../../../../store';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the SmartTransactionsController.
 *
 * @param request - The request object.
 * @returns The SmartTransactionsController.
 */
export const smartTransactionsControllerInit: ControllerInitFunction<
  SmartTransactionsController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const transactionController = request.getController('TransactionController');

  const smartTransactionsControllerTrackMetaMetricsEvent = (
    params: {
      event: MetaMetricsEventName;
      category: MetaMetricsEventCategory;
      properties?: ReturnType<
        typeof getSmartTransactionMetricsPropertiesType
      >;
      sensitiveProperties?: ReturnType<
        typeof getSmartTransactionMetricsSensitivePropertiesType
      >;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: {
      metaMetricsId?: string;
    },
  ) => {
    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder({
        category: params.event,
      })
        .addProperties(params.properties || {})
        .addSensitiveProperties(params.sensitiveProperties || {})
        .build(),
    );
  };

  const controller = new SmartTransactionsController({
    // @ts-expect-error TODO: resolve types
    supportedChainIds: getAllowedSmartTransactionsChainIds(),
    clientId: ClientId.Mobile,
    getNonceLock: (...args) =>
      transactionController.getNonceLock(...args),
    confirmExternalTransaction: (...args) =>
      transactionController.confirmExternalTransaction(...args),
    trackMetaMetricsEvent: smartTransactionsControllerTrackMetaMetricsEvent,
    state: persistedState.SmartTransactionsController,
    messenger: controllerMessenger,
    getTransactions: (...args) =>
      transactionController.getTransactions(...args),
    updateTransaction: (...args) =>
      transactionController.updateTransaction(...args),
    getFeatureFlags: () => selectSwapsChainFeatureFlags(store.getState()),
    getMetaMetricsProps: () => Promise.resolve({}),
  });

  return { controller };
};
