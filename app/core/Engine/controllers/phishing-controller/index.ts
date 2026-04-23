import {
  PhishingController,
  type PhishingControllerMessenger,
} from '@metamask/phishing-controller';
import type { ControllerInitFunction } from '../../types';
import { isProductSafetyDappScanningEnabled } from '../../../../util/phishingDetection';

/**
 * Initialize the PhishingController.
 *
 * @param request - The request object.
 * @returns The PhishingController.
 */
export const phishingControllerInit: ControllerInitFunction<
  PhishingController,
  PhishingControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const controller = new PhishingController({
    messenger: controllerMessenger,
  });

  if (!isProductSafetyDappScanningEnabled()) {
    controller.maybeUpdateState();
  }

  return { controller };
};
