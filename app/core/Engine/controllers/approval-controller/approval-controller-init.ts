import {
  ApprovalController,
  type ApprovalControllerMessenger,
} from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';

import type { ControllerInitFunction } from '../../types';

export const approvalControllerInit: ControllerInitFunction<
  ApprovalController,
  ApprovalControllerMessenger
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
