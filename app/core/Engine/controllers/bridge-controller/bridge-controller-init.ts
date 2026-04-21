import {
  BRIDGE_DEV_API_BASE_URL,
  BridgeClientId,
  BridgeController,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import type { TransactionParams } from '@metamask/transaction-controller';
import type { ChainId } from '@metamask/controller-utils';
import MetaMetrics from '../../../Analytics/MetaMetrics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitFunction,
} from '../../types';

/**
 * Initialize the BridgeController.
 *
 * @param request - The request object.
 * @returns The BridgeController.
 */
export const bridgeControllerInit: ControllerInitFunction<
  BridgeController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, getController } = request;

  const controller = new BridgeController({
    messenger: controllerMessenger,
    clientId: BridgeClientId.MOBILE,
    // TODO: change getLayer1GasFee type to match transactionController.getLayer1GasFee
    getLayer1GasFee: async ({
      transactionParams,
      chainId,
    }: {
      transactionParams: TransactionParams;
      chainId: ChainId;
    }) =>
      getController('TransactionController').getLayer1GasFee({
        transactionParams,
        chainId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    fetchFn: handleFetch,
    config: {
      customBridgeApiBaseUrl: BRIDGE_DEV_API_BASE_URL,
    },
    trackMetaMetricsFn: (event, properties) => {
      const metricsEvent = MetricsEventBuilder.createEventBuilder({
        // category property here maps to event name
        category: event,
      })
        .addProperties({
          ...(properties ?? {}),
        })
        .build();
      MetaMetrics.getInstance().trackEvent(metricsEvent);
    },
  });

  return { controller };
};
