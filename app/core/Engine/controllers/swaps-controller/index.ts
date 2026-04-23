import SwapsController from '@metamask/swaps-controller';
import AppConstants from '../../../AppConstants';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../util/networks/engineNetworkUtils';
import { swapsSupportedChainIds } from '../../constants';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the SwapsController.
 *
 * @param request - The request object.
 * @returns The SwapsController.
 */
export const swapsControllerInit: ControllerInitFunction<
  SwapsController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> = (request) => {
  const { controllerMessenger } = request;

  const gasFeeController = request.getController('GasFeeController');

  const controller = new SwapsController({
    clientId: AppConstants.SWAPS.CLIENT_ID,
    fetchAggregatorMetadataThreshold:
      AppConstants.SWAPS.CACHE_AGGREGATOR_METADATA_THRESHOLD,
    fetchTokensThreshold: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
    fetchTopAssetsThreshold: AppConstants.SWAPS.CACHE_TOP_ASSETS_THRESHOLD,
    supportedChainIds: swapsSupportedChainIds,
    messenger: controllerMessenger,
    pollCountLimit: AppConstants.SWAPS.POLL_COUNT_LIMIT,
    fetchGasFeeEstimates: () =>
      gasFeeController.fetchGasFeeEstimates(),
    fetchEstimatedMultiLayerL1Fee,
  });

  return { controller };
};
