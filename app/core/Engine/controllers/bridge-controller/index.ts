import {
  BRIDGE_DEV_API_BASE_URL,
  BridgeClientId,
  BridgeController,
  type BridgeControllerMessenger,
} from '@metamask/bridge-controller';
import { ChainId, handleFetch } from '@metamask/controller-utils';
import type { TransactionParams } from '@metamask/transaction-controller';
import { MetaMetrics } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the BridgeController.
 *
 * @param request - The request object.
 * @returns The BridgeController.
 */
export const bridgeControllerInit: ControllerInitFunction<
  BridgeController,
  BridgeControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const transactionController = request.getController('TransactionController');

  const controller = new BridgeController({
    messenger: controllerMessenger,
    clientId: BridgeClientId.MOBILE,
    getLayer1GasFee: async ({
      transactionParams,
      chainId,
    }: {
      transactionParams: TransactionParams;
      chainId: ChainId;
    }) =>
      transactionController.getLayer1GasFee({
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
