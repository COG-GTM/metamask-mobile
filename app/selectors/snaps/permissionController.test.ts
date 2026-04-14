import { selectPermissionControllerState, getPermissions, selectSubjectMetadataControllerState, selectTargetSubjectMetadata } from './permissionController';

describe('Snap PermissionController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        PermissionController: {
          subjects: {
            'npm:snap-1': {
              permissions: {
                snap_dialog: { id: 'perm1' },
              },
            },
          },
        },
        SubjectMetadataController: {
          subjectMetadata: {
            'npm:snap-1': {
              name: 'Snap 1',
              subjectType: 'snap',
              svgIcon: '<svg></svg>',
            },
            'https://dapp.com': {
              name: 'Dapp',
              subjectType: 'website',
            },
          },
        },
      },
    },
  } as any;

  it('selectPermissionControllerState should return controller state', () => {
    const result = selectPermissionControllerState(mockState);
    expect(result.subjects).toBeDefined();
  });

  it('getPermissions should return permissions for origin', () => {
    const result = getPermissions(mockState, 'npm:snap-1');
    expect(result).toHaveProperty('snap_dialog');
  });

  it('getPermissions should return undefined for unknown origin', () => {
    const result = getPermissions(mockState, 'unknown');
    expect(result).toBeUndefined();
  });

  it('getPermissions should return undefined when origin not provided', () => {
    const result = getPermissions(mockState, undefined);
    expect(result).toBeUndefined();
  });

  it('selectSubjectMetadataControllerState should return state', () => {
    const result = selectSubjectMetadataControllerState(mockState);
    expect(result.subjectMetadata).toBeDefined();
  });

  it('selectTargetSubjectMetadata should return metadata with embedded svg for snaps', () => {
    const result = selectTargetSubjectMetadata(mockState, 'npm:snap-1');
    expect(result.name).toBe('Snap 1');
    expect(result.iconUrl).toContain('data:image/svg+xml');
  });

  it('selectTargetSubjectMetadata should return raw metadata for non-snap subjects', () => {
    const result = selectTargetSubjectMetadata(mockState, 'https://dapp.com');
    expect(result.name).toBe('Dapp');
    expect(result.iconUrl).toBeUndefined();
  });
});
