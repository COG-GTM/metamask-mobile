import { RootState } from '../../reducers';
import { selectSnapsMetadata } from './snapController';

const LOCALIZED_SNAP_ID = 'npm:@metamask/localized-snap';
const PLAIN_SNAP_ID = 'npm:@metamask/plain-snap';

const createState = (snaps: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        SnapController: {
          snaps,
        },
      },
    },
  } as unknown as RootState);

const SNAPS_MOCK = {
  [LOCALIZED_SNAP_ID]: {
    id: LOCALIZED_SNAP_ID,
    manifest: {
      proposedName: '{{name}}',
      description: '{{description}}',
    },
    localizationFiles: [
      {
        locale: 'en',
        messages: {
          name: { message: 'Localized Snap' },
          description: { message: 'A localized description' },
        },
      },
    ],
  },
  [PLAIN_SNAP_ID]: {
    id: PLAIN_SNAP_ID,
    manifest: {
      proposedName: 'Plain Snap',
      description: 'A plain description',
    },
  },
};

describe('SnapController selectors', () => {
  describe('selectSnapsMetadata', () => {
    it('resolves localized name and description for snaps with localizationFiles', () => {
      const metadata = selectSnapsMetadata(createState(SNAPS_MOCK));

      expect(metadata[LOCALIZED_SNAP_ID]).toStrictEqual({
        name: 'Localized Snap',
        description: 'A localized description',
      });
    });

    it('uses the raw manifest name and description for snaps without localizationFiles', () => {
      const metadata = selectSnapsMetadata(createState(SNAPS_MOCK));

      expect(metadata[PLAIN_SNAP_ID]).toStrictEqual({
        name: 'Plain Snap',
        description: 'A plain description',
      });
    });

    it('returns metadata keyed by snap id for every snap', () => {
      const metadata = selectSnapsMetadata(createState(SNAPS_MOCK));

      expect(Object.keys(metadata).sort()).toStrictEqual(
        [LOCALIZED_SNAP_ID, PLAIN_SNAP_ID].sort(),
      );
    });

    it('returns an empty object when there are no snaps', () => {
      expect(selectSnapsMetadata(createState({}))).toStrictEqual({});
    });
  });
});
