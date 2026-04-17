import {
  selectPermissionControllerState,
  getPermissions,
  selectSubjectMetadataControllerState,
  selectTargetSubjectMetadata,
} from './permissionController';

const mockState = {
  engine: {
    backgroundState: {
      PermissionController: {
        subjects: {
          'https://example.com': {
            permissions: {
              eth_accounts: { parentCapability: 'eth_accounts' },
            },
          },
        },
      },
      SubjectMetadataController: {
        subjectMetadata: {
          'https://example.com': {
            name: 'Example DApp',
            subjectType: 'website',
            origin: 'https://example.com',
          },
          'npm:@metamask/test-snap': {
            name: 'Test Snap',
            subjectType: 'snap',
            origin: 'npm:@metamask/test-snap',
            svgIcon: '<svg></svg>',
          },
        },
      },
    },
  },
} as any;

describe('permissionController selectors', () => {
  it('selectPermissionControllerState returns PermissionController state', () => {
    const result = selectPermissionControllerState(mockState);
    expect(result).toBe(mockState.engine.backgroundState.PermissionController);
  });

  it('getPermissions returns permissions for origin', () => {
    const result = getPermissions(mockState, 'https://example.com');
    expect(result).toEqual({
      eth_accounts: { parentCapability: 'eth_accounts' },
    });
  });

  it('getPermissions returns undefined for unknown origin', () => {
    const result = getPermissions(mockState, 'https://unknown.com');
    expect(result).toBeUndefined();
  });

  it('getPermissions returns undefined when no origin provided', () => {
    const result = getPermissions(mockState, undefined);
    expect(result).toBeUndefined();
  });

  it('selectSubjectMetadataControllerState returns state', () => {
    const result = selectSubjectMetadataControllerState(mockState);
    expect(result).toBe(mockState.engine.backgroundState.SubjectMetadataController);
  });

  it('selectTargetSubjectMetadata returns metadata for website', () => {
    const result = selectTargetSubjectMetadata(mockState, 'https://example.com');
    expect(result).toEqual({
      name: 'Example DApp',
      subjectType: 'website',
      origin: 'https://example.com',
    });
  });

  it('selectTargetSubjectMetadata returns metadata with iconUrl for snap', () => {
    const result = selectTargetSubjectMetadata(mockState, 'npm:@metamask/test-snap');
    expect(result).toEqual(expect.objectContaining({
      name: 'Test Snap',
      subjectType: 'snap',
    }));
    expect(result.iconUrl).toContain('data:image/svg+xml');
  });
});
