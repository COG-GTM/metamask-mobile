import { AccountTrackerController } from '@metamask/assets-controllers';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Initialize the AccountTrackerController.
 *
 * @param request - The request object.
 * @returns The AccountTrackerController.
 */
export const accountTrackerControllerInit: ControllerInitFunction<
  AccountTrackerController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const assetsContractController = request.getController('AssetsContractController');

  const controller = new AccountTrackerController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: persistedState.AccountTrackerController ?? {
      accountsByChainId: {},
    },
    getStakedBalanceForChain:
      assetsContractController.getStakedBalanceForChain.bind(
        assetsContractController,
      ),
    includeStakedAssets: true,
  });

  return { controller };
};
