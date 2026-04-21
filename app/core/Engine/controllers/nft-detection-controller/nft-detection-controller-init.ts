import {
  NftDetectionController,
  NftDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the NftDetectionController.
 *
 * @param request - The request object.
 * @returns The NftDetectionController.
 */
export const nftDetectionControllerInit: ControllerInitFunction<
  NftDetectionController,
  NftDetectionControllerMessenger
> = (request) => {
  const { controllerMessenger, getController } = request;

  const nftDetectionController = new NftDetectionController({
    messenger: controllerMessenger,
    disabled: false,
    addNft: (...args) => getController('NftController').addNft(...args),
    getNftState: () => getController('NftController').state,
  });

  return { controller: nftDetectionController };
};
