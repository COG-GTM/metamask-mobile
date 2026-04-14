import { selectSnapControllerState, selectSnaps } from './snapController';

jest.mock('@metamask/snaps-utils', () => ({
  getLocalizedSnapManifest: jest.fn((manifest) => manifest),
}));

describe('SnapController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        SnapController: {
          snaps: {
            'npm:snap-1': {
              id: 'npm:snap-1',
              manifest: { proposedName: 'Snap One', description: 'First snap' },
              localizationFiles: null,
            },
            'npm:snap-2': {
              id: 'npm:snap-2',
              manifest: { proposedName: 'Snap Two', description: 'Second snap' },
              localizationFiles: null,
            },
          },
        },
      },
    },
  } as any;

  it('selectSnapControllerState should return controller state', () => {
    const result = selectSnapControllerState(mockState);
    expect(result.snaps).toBeDefined();
    expect(Object.keys(result.snaps)).toHaveLength(2);
  });

  it('selectSnaps should return snaps map', () => {
    const result = selectSnaps(mockState);
    expect(result['npm:snap-1'].id).toBe('npm:snap-1');
    expect(result['npm:snap-2'].manifest.proposedName).toBe('Snap Two');
  });
});
