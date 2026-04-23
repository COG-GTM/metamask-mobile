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

  const nftController = getController('NftController');

  const controller = new NftDetectionController({
    messenger: controllerMessenger,
    disabled: false,
    addNft: nftController.addNft.bind(nftController),
    getNftState: () => nftController.state,
  });

  return { controller };
};
