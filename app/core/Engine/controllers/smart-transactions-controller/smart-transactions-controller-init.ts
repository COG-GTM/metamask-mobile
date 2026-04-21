import SmartTransactionsController, {
  SmartTransactionsControllerMessenger,
} from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '@metamask/smart-transactions-controller/dist/constants';
import {
  getSmartTransactionMetricsProperties as getSmartTransactionMetricsPropertiesType,
  getSmartTransactionMetricsSensitiveProperties as getSmartTransactionMetricsSensitivePropertiesType,
} from '@metamask/smart-transactions-controller/dist/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../../app/constants/smartTransactions';
import { MetaMetrics } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { selectSwapsChainFeatureFlags } from '../../../../reducers/swaps';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitFunction,
} from '../../types';

const smartTransactionsControllerTrackMetaMetricsEvent = (
  params: {
    event: MetaMetricsEventName;
    category: MetaMetricsEventCategory;
    properties?: ReturnType<typeof getSmartTransactionMetricsPropertiesType>;
    sensitiveProperties?: ReturnType<
      typeof getSmartTransactionMetricsSensitivePropertiesType
    >;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: {
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

/**
 * Initialize the SmartTransactionsController.
 *
 * @param request - The request object.
 * @returns The SmartTransactionsController.
 */
export const smartTransactionsControllerInit: ControllerInitFunction<
  SmartTransactionsController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState, getController, getState } =
    request;

  const controller = new SmartTransactionsController({
    // @ts-expect-error TODO: resolve types
    supportedChainIds: getAllowedSmartTransactionsChainIds(),
    clientId: ClientId.Mobile,
    getNonceLock: (...args) =>
      getController('TransactionController').getNonceLock(...args),
    confirmExternalTransaction: (...args) =>
      getController('TransactionController').confirmExternalTransaction(
        ...args,
      ),
    trackMetaMetricsEvent: smartTransactionsControllerTrackMetaMetricsEvent,
    state: persistedState.SmartTransactionsController,
    messenger: controllerMessenger as unknown as SmartTransactionsControllerMessenger,
    getTransactions: (...args) =>
      getController('TransactionController').getTransactions(...args),
    updateTransaction: (...args) =>
      getController('TransactionController').updateTransaction(...args),
    getFeatureFlags: () => selectSwapsChainFeatureFlags(getState()),
    getMetaMetricsProps: () => Promise.resolve({}), // Return MetaMetrics props once we enable HW wallets for smart transactions.
  });

  return { controller };
};
