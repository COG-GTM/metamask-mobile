import {
  TokenSearchDiscoveryDataController,
  CodefiTokenPricesServiceV2,
} from '@metamask/assets-controllers';
import { swapsUtils } from '@metamask/swaps-controller';
import AppConstants from '../../../AppConstants';
import { swapsSupportedChainIds } from '../../constants';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the TokenSearchDiscoveryDataController.
 *
 * @param request - The request object.
 * @returns The TokenSearchDiscoveryDataController.
 */
export const tokenSearchDiscoveryDataControllerInit: ControllerInitFunction<
  TokenSearchDiscoveryDataController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> = (request) => {
  const { controllerMessenger } = request;

  const controller = new TokenSearchDiscoveryDataController({
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    swapsSupportedChainIds,
    fetchSwapsTokensThresholdMs: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
    fetchTokens: swapsUtils.fetchTokens,
    messenger: controllerMessenger,
  });

  return { controller };
};
