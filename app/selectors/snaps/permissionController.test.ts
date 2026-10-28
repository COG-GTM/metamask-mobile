import { SubjectType } from '@metamask/permission-controller';
import { RootState } from '../../reducers';
import { selectTargetSubjectMetadata } from './permissionController';

const SNAP_ID = 'npm:@metamask/bip32-example-snap';
const ORIGIN = 'https://metamask.github.io';

const snapEntry = {
  extensionId: null,
  iconUrl: null,
  name: 'BIP-32 Example Snap',
  origin: SNAP_ID,
  subjectType: SubjectType.Snap,
  svgIcon: '<svg />',
  version: '1.0.0',
};

const websiteEntry = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/favicon.ico',
  name: 'Test Dapp',
  origin: ORIGIN,
  subjectType: SubjectType.Website,
};

const buildState = (subjectMetadata: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        SubjectMetadataController: { subjectMetadata },
      },
    },
  } as unknown as RootState);

describe('selectTargetSubjectMetadata', () => {
  it('derives an embeddable iconUrl for snap subjects', () => {
    const state = buildState({ [SNAP_ID]: snapEntry });

    expect(selectTargetSubjectMetadata(state, SNAP_ID)).toStrictEqual({
      ...snapEntry,
      iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg />')}`,
    });
  });

  it('returns a null iconUrl for snaps without an svgIcon', () => {
    const state = buildState({
      [SNAP_ID]: { ...snapEntry, svgIcon: undefined },
    });

    expect(selectTargetSubjectMetadata(state, SNAP_ID)?.iconUrl).toBeNull();
  });

  it('returns the same reference for a snap while its metadata entry is unchanged', () => {
    const first = selectTargetSubjectMetadata(
      buildState({ [SNAP_ID]: snapEntry }),
      SNAP_ID,
    );
    const second = selectTargetSubjectMetadata(
      buildState({ [SNAP_ID]: snapEntry, [ORIGIN]: websiteEntry }),
      SNAP_ID,
    );

    expect(second).toBe(first);
  });

  it('returns a new value when the snap metadata entry changes', () => {
    const first = selectTargetSubjectMetadata(
      buildState({ [SNAP_ID]: snapEntry }),
      SNAP_ID,
    );
    const updatedEntry = { ...snapEntry, svgIcon: '<svg id="new" />' };
    const second = selectTargetSubjectMetadata(
      buildState({ [SNAP_ID]: updatedEntry }),
      SNAP_ID,
    );

    expect(second).not.toBe(first);
    expect(second?.iconUrl).toBe(
      `data:image/svg+xml;utf8,${encodeURIComponent('<svg id="new" />')}`,
    );
  });

  it('returns the raw entry for non-snap subjects', () => {
    const state = buildState({ [ORIGIN]: websiteEntry });

    expect(selectTargetSubjectMetadata(state, ORIGIN)).toBe(websiteEntry);
  });

  it('returns undefined for unknown subjects', () => {
    const state = buildState({ [SNAP_ID]: snapEntry });

    expect(selectTargetSubjectMetadata(state, 'npm:unknown')).toBeUndefined();
  });
});
