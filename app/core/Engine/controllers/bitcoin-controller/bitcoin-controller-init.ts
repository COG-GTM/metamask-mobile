import {
  BitcoinController,
  type BitcoinControllerState,
  type BitcoinControllerMessenger,
} from './bitcoin-controller';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the BitcoinController.
 *
 * @param request - The request object.
 * @returns The BitcoinController.
 */
export const bitcoinControllerInit: ControllerInitFunction<
  BitcoinController,
  BitcoinControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const bitcoinControllerState =
    persistedState.BitcoinController as BitcoinControllerState;

  const controller = new BitcoinController({
    messenger: controllerMessenger,
    state: bitcoinControllerState,
  });

  controller.startPolling();

  return { controller };
};
