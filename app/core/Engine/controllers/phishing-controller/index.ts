import {
  PhishingController,
  type PhishingControllerMessenger,
} from '@metamask/phishing-controller';
import type { ControllerInitFunction } from '../../types';

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

  return { controller };
};
