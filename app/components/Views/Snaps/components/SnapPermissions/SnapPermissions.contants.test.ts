import SNAP_PERMISSIONS from './SnapPermissions.contants';

describe('SnapPermissions constants', () => {
  it('exports the "snap-permissions" identifier', () => {
    expect(SNAP_PERMISSIONS).toBe('snap-permissions');
  });
});
