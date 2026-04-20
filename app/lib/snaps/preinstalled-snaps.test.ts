import PREINSTALLED_SNAPS from './preinstalled-snaps';

describe('PREINSTALLED_SNAPS', () => {
  it('is an array', () => {
    expect(Array.isArray(PREINSTALLED_SNAPS)).toBe(true);
  });

  it('only contains non-null objects', () => {
    for (const snap of PREINSTALLED_SNAPS) {
      expect(snap).not.toBeNull();
      expect(typeof snap).toBe('object');
    }
  });
});
