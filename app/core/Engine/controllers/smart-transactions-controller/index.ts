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

  // Use a deferred getter to break the circular dependency:
  // SmartTransactionsController is initialized before TransactionController,
  // but all usages are in callbacks invoked at runtime (after all controllers are initialized).
  const getTransactionController = () =>
    request.getController('TransactionController');

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
      getTransactionController().getNonceLock(...args),
    confirmExternalTransaction: (...args) =>
      getTransactionController().confirmExternalTransaction(...args),
    trackMetaMetricsEvent: smartTransactionsControllerTrackMetaMetricsEvent,
    state: persistedState.SmartTransactionsController,
    messenger: controllerMessenger,
    getTransactions: (...args) =>
      getTransactionController().getTransactions(...args),
    updateTransaction: (...args) =>
      getTransactionController().updateTransaction(...args),
    getFeatureFlags: () => selectSwapsChainFeatureFlags(store.getState()),
    getMetaMetricsProps: () => Promise.resolve({}),
  });

  return { controller };
};
