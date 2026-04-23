import type { TokenSearchDiscoveryController } from '@metamask/token-search-discovery-controller';
import type { TokenSearchDiscoveryControllerMessenger } from '@metamask/token-search-discovery-controller';
import type { ControllerInitFunction } from '../../types';
import { createTokenSearchDiscoveryController } from './utils';

/**
 * Initialize the TokenSearchDiscoveryController.
 *
 * @param request - The request object.
 * @returns The TokenSearchDiscoveryController.
 */
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
