import {
  AssetsContractController,
  type AssetsContractControllerMessenger,
} from '@metamask/assets-controllers';

import type { ControllerInitFunction } from '../../types';

export const assetsContractControllerInit: ControllerInitFunction<
  AssetsContractController,
  AssetsContractControllerMessenger
> = (request) => {
  const { controllerMessenger, getGlobalChainId } = request;

  const controller = new AssetsContractController({
    messenger: controllerMessenger,
    chainId: getGlobalChainId(),
  });

  return { controller };
};
