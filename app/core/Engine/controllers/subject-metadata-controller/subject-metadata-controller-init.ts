///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  SubjectMetadataController,
  type SubjectMetadataControllerMessenger,
} from '@metamask/permission-controller';

import Logger from '../../../../util/Logger';
import type { ControllerInitFunction } from '../../types';

export const subjectMetadataControllerInit: ControllerInitFunction<
  SubjectMetadataController,
  SubjectMetadataControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  try {
    const subjectMetadataController = new SubjectMetadataController({
      messenger: controllerMessenger,
      state: persistedState.SubjectMetadataController || {},
      subjectCacheLimit: 100,
    });

    return { controller: subjectMetadataController };
  } catch (error) {
    Logger.error(
      error as Error,
      'Failed to initialize SubjectMetadataController',
    );
    throw error;
  }
};
///: END:ONLY_INCLUDE_IF
