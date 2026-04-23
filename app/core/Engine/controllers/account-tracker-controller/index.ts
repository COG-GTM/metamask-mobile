import { AccountTrackerController, AssetsContractController } from '@metamask/assets-controllers';
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

  const assetsContractController = request.getController(
    'AssetsContractController',
  ) as AssetsContractController;

  const controller = new AccountTrackerController({
    messenger: controllerMessenger,
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
