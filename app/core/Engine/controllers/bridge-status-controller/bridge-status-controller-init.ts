import {
  BRIDGE_DEV_API_BASE_URL,
  BridgeClientId,
} from '@metamask/bridge-controller';
import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { handleFetch } from '@metamask/controller-utils';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitFunction,
} from '../../types';

/**
 * Initialize the BridgeStatusController.
 *
 * @param request - The request object.
 * @returns The BridgeStatusController.
 */
export const bridgeStatusControllerInit: ControllerInitFunction<
  BridgeStatusController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState, getController } = request;

  const controller = new BridgeStatusController({
    messenger: controllerMessenger,
    state: persistedState.BridgeStatusController,
    clientId: BridgeClientId.MOBILE,
    fetchFn: handleFetch,
    addTransactionFn: (...args) =>
      getController('TransactionController').addTransaction(
        ...(args as Parameters<
          ReturnType<
            typeof getController<'TransactionController'>
          >['addTransaction']
        >),
      ),
    estimateGasFeeFn: (...args) =>
      getController('TransactionController').estimateGasFee(
        ...(args as Parameters<
          ReturnType<
            typeof getController<'TransactionController'>
          >['estimateGasFee']
        >),
      ),
    // userOperationController is not available on mobile; omit the hook.
    config: {
      customBridgeApiBaseUrl: BRIDGE_DEV_API_BASE_URL,
    },
  });

  return { controller };
};
