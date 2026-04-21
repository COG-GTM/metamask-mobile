import {
  CodefiTokenPricesServiceV2,
  TokenSearchDiscoveryDataController,
  TokenSearchDiscoveryDataControllerMessenger,
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
  TokenSearchDiscoveryDataControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const codefiTokenApiV2 = new CodefiTokenPricesServiceV2();

  const tokenSearchDiscoveryDataController =
    new TokenSearchDiscoveryDataController({
      tokenPricesService: codefiTokenApiV2,
      swapsSupportedChainIds,
      fetchSwapsTokensThresholdMs: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
      fetchTokens: swapsUtils.fetchTokens,
      messenger: controllerMessenger,
    });

  return { controller: tokenSearchDiscoveryDataController };
};
