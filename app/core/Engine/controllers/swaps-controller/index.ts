import SwapsController from '@metamask/swaps-controller';
import AppConstants from '../../../AppConstants';
import { fetchEstimatedMultiLayerL1Fee } from '../../../../util/networks/engineNetworkUtils';
import { swapsSupportedChainIds } from '../../constants';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
  BaseRestrictedControllerMessenger,
} from '../../types';

type SwapsControllerMessenger = ReturnType<
  typeof import('../../messengers/swaps-controller-messenger').getSwapsControllerMessenger
>;

/**
 * Initialize the SwapsController.
 *
 * @param request - The request object.
 * @returns The SwapsController.
 */
export const swapsControllerInit: ControllerInitFunction<
  SwapsController,
  SwapsControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const { gasFeeController } = getControllers(request);

  const controller = new SwapsController({
    clientId: AppConstants.SWAPS.CLIENT_ID,
    fetchAggregatorMetadataThreshold:
      AppConstants.SWAPS.CACHE_AGGREGATOR_METADATA_THRESHOLD,
    fetchTokensThreshold: AppConstants.SWAPS.CACHE_TOKENS_THRESHOLD,
    fetchTopAssetsThreshold: AppConstants.SWAPS.CACHE_TOP_ASSETS_THRESHOLD,
    supportedChainIds: swapsSupportedChainIds,
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    messenger: controllerMessenger,
    pollCountLimit: AppConstants.SWAPS.POLL_COUNT_LIMIT,
    // TODO: Remove once GasFeeController exports this action type
    fetchGasFeeEstimates: () =>
      gasFeeController.fetchGasFeeEstimates(),
    fetchEstimatedMultiLayerL1Fee,
  });

  return { controller };
};

function getControllers(
  request: ControllerInitRequest<SwapsControllerMessenger>,
) {
  return {
    gasFeeController: request.getController('GasFeeController'),
  };
}
