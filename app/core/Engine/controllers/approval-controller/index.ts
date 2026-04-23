import {
  ApprovalController,
  ApprovalType,
} from '@metamask/approval-controller';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    showApprovalRequest: () => undefined,
    typesExcludedFromRateLimiting: [
      ApprovalType.Transaction,
      ApprovalType.WatchAsset,
    ],
  });

  return { controller };
};
