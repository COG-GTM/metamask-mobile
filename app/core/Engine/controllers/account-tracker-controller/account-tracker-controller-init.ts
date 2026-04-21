import {
  AccountTrackerController,
  type AccountTrackerControllerMessenger,
  type AssetsContractController,
} from '@metamask/assets-controllers';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
} from '../../types';

export const accountTrackerControllerInit: ControllerInitFunction<
  AccountTrackerController,
  AccountTrackerControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;
  const { assetsContractController } = getControllers(request);

  const controller = new AccountTrackerController({
    messenger: controllerMessenger,
    state: persistedState.AccountTrackerController ?? {
      accountsByChainId: {},
    },
    getStakedBalanceForChain: (
      ...args: Parameters<AssetsContractController['getStakedBalanceForChain']>
    ) => assetsContractController.getStakedBalanceForChain(...args),
    includeStakedAssets: true,
  });

  return { controller };
};

function getControllers(
  request: ControllerInitRequest<AccountTrackerControllerMessenger>,
) {
  return {
    assetsContractController: request.getController('AssetsContractController'),
  };
}
