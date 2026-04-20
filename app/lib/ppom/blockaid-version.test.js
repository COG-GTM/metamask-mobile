import blockaidVersion from './blockaid-version';

describe('blockaid-version', () => {
  it('exports an object with a BlockaidVersion string', () => {
    expect(blockaidVersion).toEqual(
      expect.objectContaining({ BlockaidVersion: expect.any(String) }),
    );
  });

  it('BlockaidVersion follows semver major.minor.patch', () => {
    expect(blockaidVersion.BlockaidVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
