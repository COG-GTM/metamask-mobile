import {
  selectSnapControllerState,
  selectSnaps,
  selectSnapsMetadata,
} from './snapController';
import type { RootState } from '../../reducers';

const makeSnap = (
  id: string,
  manifest: Record<string, unknown>,
  localizationFiles?: unknown,
) => ({
  id,
  manifest,
  ...(localizationFiles !== undefined ? { localizationFiles } : {}),
});

const makeState = (snaps: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        SnapController: { snaps },
      },
    },
  } as unknown as RootState);

describe('snaps/snapController selectors', () => {
  const snapA = makeSnap('npm:alpha', {
    proposedName: 'Alpha',
    description: 'Alpha description',
  });
  const snapB = makeSnap('npm:beta', {
    proposedName: 'Beta',
    description: 'Beta description',
  });

  it('selectSnapControllerState exposes the full controller slice', () => {
    const state = makeState({ 'npm:alpha': snapA });
    expect(selectSnapControllerState(state)).toEqual({
      snaps: { 'npm:alpha': snapA },
    });
  });

  it('selectSnaps returns the snaps map', () => {
    const state = makeState({ 'npm:alpha': snapA });
    expect(selectSnaps(state)).toEqual({ 'npm:alpha': snapA });
  });

  it('selectSnapsMetadata extracts name + description per snap from unlocalized manifests', () => {
    const state = makeState({ 'npm:alpha': snapA, 'npm:beta': snapB });
    expect(selectSnapsMetadata(state)).toEqual({
      'npm:alpha': { name: 'Alpha', description: 'Alpha description' },
      'npm:beta': { name: 'Beta', description: 'Beta description' },
    });
  });

  it('selectSnapsMetadata returns an empty map when there are no snaps', () => {
    expect(selectSnapsMetadata(makeState({}))).toEqual({});
  });
});
