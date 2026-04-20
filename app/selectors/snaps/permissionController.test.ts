import { SubjectType } from '@metamask/permission-controller';
import {
  getPermissions,
  selectPermissionControllerState,
  selectSubjectMetadataControllerState,
  selectTargetSubjectMetadata,
} from './permissionController';
import type { RootState } from '../../reducers';

const makeState = (
  subjects: Record<string, unknown> = {},
  subjectMetadata: Record<string, unknown> = {},
) =>
  ({
    engine: {
      backgroundState: {
        PermissionController: { subjects },
        SubjectMetadataController: { subjectMetadata },
      },
    },
  } as unknown as RootState);

describe('snaps/permissionController selectors', () => {
  it('selectPermissionControllerState returns the PermissionController slice', () => {
    const state = makeState({ 'https://a.io': { permissions: { x: {} } } });
    expect(selectPermissionControllerState(state)).toEqual({
      subjects: { 'https://a.io': { permissions: { x: {} } } },
    });
  });

  it('getPermissions returns permissions for the given origin', () => {
    const state = makeState({
      'https://a.io': { permissions: { eth_accounts: {} } },
    });
    expect(getPermissions(state, 'https://a.io')).toEqual({
      eth_accounts: {},
    });
  });

  it('getPermissions returns undefined when the origin is not set', () => {
    expect(getPermissions(makeState(), undefined)).toBeUndefined();
  });

  it('selectSubjectMetadataControllerState returns the subject metadata slice', () => {
    const state = makeState({}, { 'https://a.io': { origin: 'https://a.io' } });
    expect(selectSubjectMetadataControllerState(state)).toEqual({
      subjectMetadata: { 'https://a.io': { origin: 'https://a.io' } },
    });
  });

  it('selectTargetSubjectMetadata returns metadata unchanged for non-snap subjects', () => {
    const metadata = {
      origin: 'https://a.io',
      subjectType: SubjectType.Website,
    };
    const state = makeState({}, { 'https://a.io': metadata });
    expect(selectTargetSubjectMetadata(state, 'https://a.io')).toBe(metadata);
  });

  it('selectTargetSubjectMetadata augments Snap subjects with an embeddable iconUrl', () => {
    const metadata = {
      origin: 'snap-id',
      subjectType: SubjectType.Snap,
      svgIcon: '<svg/>',
    };
    const state = makeState({}, { 'snap-id': metadata });
    const result = selectTargetSubjectMetadata(state, 'snap-id');
    expect(result).toEqual({
      ...metadata,
      iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg/>')}`,
    });
  });

  it('selectTargetSubjectMetadata sets iconUrl to null when a Snap has no svg icon', () => {
    const metadata = { origin: 'snap-id', subjectType: SubjectType.Snap };
    const state = makeState({}, { 'snap-id': metadata });
    const result = selectTargetSubjectMetadata(state, 'snap-id') as {
      iconUrl: null | string;
    };
    expect(result.iconUrl).toBeNull();
  });
});
