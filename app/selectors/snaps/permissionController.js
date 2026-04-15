
import { memoize } from 'lodash';
import { SubjectType } from '@metamask/permission-controller';
import { createDeepEqualSelector } from '../util';

export const selectPermissionControllerState = (state) =>
state.engine.backgroundState.PermissionController;

const selectOrigin = (_state, origin) =>
origin;

export const getPermissions = createDeepEqualSelector(
  [selectPermissionControllerState, selectOrigin],
  (state, origin) => origin ? state.subjects[origin]?.permissions : undefined
);

export const selectSubjectMetadataControllerState = (state) =>
state.engine.backgroundState.SubjectMetadataController;

const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`
);

function selectSubjectMetadata(state) {
  return selectSubjectMetadataControllerState(state).subjectMetadata;
}

export function selectTargetSubjectMetadata(state, origin) {
  const metadata = selectSubjectMetadata(state)[origin];

  if (metadata?.subjectType === SubjectType.Snap) {
    return {
      ...metadata,
      iconUrl: metadata.svgIcon ? getEmbeddableSvg(metadata.svgIcon) : null
    };
  }

  return metadata;
}