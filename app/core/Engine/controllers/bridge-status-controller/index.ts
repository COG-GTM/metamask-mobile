import {
  BridgeStatusController,
  type BridgeStatusControllerMessenger,
} from '@metamask/bridge-status-controller';
import {
  BRIDGE_DEV_API_BASE_URL,
  BridgeClientId,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the BridgeStatusController.
 *
 * @param request - The request object.
 * @returns The BridgeStatusController.
 */
export const bridgeStatusControllerInit: ControllerInitFunction<
  BridgeStatusController,
  BridgeStatusControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const transactionController = request.getController('TransactionController');

  const controller = new BridgeStatusController({
    messenger: controllerMessenger,
    state: persistedState.BridgeStatusController,
    clientId: BridgeClientId.MOBILE,
    fetchFn: handleFetch,
    addTransactionFn: (
      ...args: Parameters<typeof transactionController.addTransaction>
    ) => transactionController.addTransaction(...args),
    estimateGasFeeFn: (
      ...args: Parameters<typeof transactionController.estimateGasFee>
    ) => transactionController.estimateGasFee(...args),
    addUserOperationFromTransactionFn: (...args: unknown[]) =>
      // @ts-expect-error - userOperationController will be made optional, it's only relevant for extension
      undefined,
    config: {
      customBridgeApiBaseUrl: BRIDGE_DEV_API_BASE_URL,
    },
  });

  return { controller };
};
