import {
  TokenSearchDiscoveryController,
} from '@metamask/token-search-discovery-controller';
import type { TokenSearchDiscoveryControllerMessenger } from '@metamask/token-search-discovery-controller/dist/token-search-discovery-controller.cjs';

import type { ControllerInitFunction } from '../../types';
import { createTokenSearchDiscoveryController } from './utils';

export const tokenSearchDiscoveryControllerInit: ControllerInitFunction<
  TokenSearchDiscoveryController,
  TokenSearchDiscoveryControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = createTokenSearchDiscoveryController({
    state: persistedState.TokenSearchDiscoveryController,
    messenger: controllerMessenger,
  });

  return { controller };
};
