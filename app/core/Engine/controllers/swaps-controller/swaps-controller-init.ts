import SwapsController from '@metamask/swaps-controller';
import type { SwapsControllerMessenger } from '@metamask/swaps-controller/dist/types';
import AppConstants from '../../../AppConstants';
import { swapsSupportedChainIds } from '../../constants';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../util/networks/engineNetworkUtils';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitFunction,
} from '../../types';

/**
 * Initialize the SwapsController.
 *
 * @param request - The request object.
 * @returns The SwapsController.
 */
export const swapsControllerInit: ControllerInitFunction<
  SwapsController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, getController } = request;

  const controller = new SwapsController({
    clientId: AppConstants.SWAPS.CLIENT_ID,
    fetchAggregatorMetadataThreshold:
      AppConstants.SWAPS.CACHE_AGGREGATOR_METADATA_THRESHOLD,
    fetchTokensThreshold: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
    fetchTopAssetsThreshold: AppConstants.SWAPS.CACHE_TOP_ASSETS_THRESHOLD,
    supportedChainIds: swapsSupportedChainIds,
    messenger: controllerMessenger as unknown as SwapsControllerMessenger,
    pollCountLimit: AppConstants.SWAPS.POLL_COUNT_LIMIT,
    // TODO: Remove once GasFeeController exports this action type
    fetchGasFeeEstimates: () =>
      getController('GasFeeController').fetchGasFeeEstimates(),
    fetchEstimatedMultiLayerL1Fee,
  });

  return { controller };
};
