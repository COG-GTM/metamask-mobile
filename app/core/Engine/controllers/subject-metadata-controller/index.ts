import {
  SubjectMetadataController,
  SubjectMetadataControllerMessenger,
  SubjectMetadataControllerState,
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

  const initialState = (persistedState.SubjectMetadataController ??
    {}) as SubjectMetadataControllerState;

  const controller = new SubjectMetadataController({
    messenger: controllerMessenger,
    state: initialState,
    subjectCacheLimit: 100,
  });

  return { controller };
};
