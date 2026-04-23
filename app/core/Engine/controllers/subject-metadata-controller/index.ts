///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  SubjectMetadataController,
  type SubjectMetadataControllerMessenger,
} from '@metamask/permission-controller';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the SubjectMetadataController.
 *
 * @param request - The request object.
 * @returns The SubjectMetadataController.
 */
export const subjectMetadataControllerInit: ControllerInitFunction<
  SubjectMetadataController,
  SubjectMetadataControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SubjectMetadataController({
    messenger: controllerMessenger,
    state: persistedState.SubjectMetadataController || {},
    subjectCacheLimit: 100,
  });

  return { controller };
};
///: END:ONLY_INCLUDE_IF
