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
import { store } from '../../../../store';
import { MetaMetrics } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
  BaseRestrictedControllerMessenger,
} from '../../types';

type SmartTransactionsControllerMessenger = ReturnType<
  typeof import('../../messengers/smart-transactions-controller-messenger').getSmartTransactionsControllerMessenger
>;

/**
 * Initialize the SmartTransactionsController.
 *
 * @param request - The request object.
 * @returns The SmartTransactionsController.
 */
export const smartTransactionsControllerInit: ControllerInitFunction<
  SmartTransactionsController,
  SmartTransactionsControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const { transactionController } = getControllers(request);

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
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
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

function getControllers(
  request: ControllerInitRequest<SmartTransactionsControllerMessenger>,
) {
  return {
    transactionController: request.getController('TransactionController'),
  };
}
