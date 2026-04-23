import { ApprovalController } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Initialize the ApprovalController.
 *
 * @param request - The request object.
 * @returns The ApprovalController.
 */
export const approvalControllerInit: ControllerInitFunction<
  ApprovalController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const controller = new ApprovalController({
    messenger: controllerMessenger,
    showApprovalRequest: () => undefined,
    typesExcludedFromRateLimiting: [
      ApprovalType.Transaction,
      ApprovalType.WatchAsset,
    ],
  });

  return { controller };
};
