import { RootState } from '../../reducers';
import { memoize } from 'lodash';
import { GenericPermissionController, SubjectType } from '@metamask/permission-controller';
import { createDeepEqualSelector } from '../util';

export const selectPermissionControllerState = (state: RootState) =>
  state.engine.backgroundState.PermissionController as GenericPermissionController['state'];

const selectOrigin = (_state: RootState, origin?: string) =>
  origin;

export const getPermissions = createDeepEqualSelector(
  [selectPermissionControllerState, selectOrigin],
  (state, origin) => origin ? state.subjects[origin]?.permissions : undefined,
);

export const selectSubjectMetadataControllerState = (state: RootState) =>
  state.engine.backgroundState.SubjectMetadataController;

const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

function selectSubjectMetadata(state: RootState) {
  return selectSubjectMetadataControllerState(state).subjectMetadata;
}

type SubjectMetadataEntry = ReturnType<typeof selectSubjectMetadata>[string];

const snapSubjectMetadataCache = new WeakMap<
  SubjectMetadataEntry,
  SubjectMetadataEntry & { iconUrl: string | null }
>();

export function selectTargetSubjectMetadata(state: RootState, origin: string) {
  const metadata = selectSubjectMetadata(state)[origin];

  if (metadata?.subjectType === SubjectType.Snap) {
    let snapMetadata = snapSubjectMetadataCache.get(metadata);
    if (!snapMetadata) {
      snapMetadata = {
        ...metadata,
        iconUrl: metadata.svgIcon ? getEmbeddableSvg(metadata.svgIcon) : null,
      };
      snapSubjectMetadataCache.set(metadata, snapMetadata);
    }
    return snapMetadata;
  }

  return metadata;
}
