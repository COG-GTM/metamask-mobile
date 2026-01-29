import { getTypeScriptAdoptionStats } from './typescript-adoption';

describe('getTypeScriptAdoptionStats()', (): void => {
  it('should return valid adoption stats', (): void => {
    const stats = getTypeScriptAdoptionStats();

    expect(stats.tsFiles).toBeGreaterThan(0);
    expect(stats.jsFiles).toBeGreaterThanOrEqual(0);
    expect(stats.totalFiles).toBe(stats.tsFiles + stats.jsFiles);
    expect(stats.adoptionPercentage).toBeGreaterThanOrEqual(0);
    expect(stats.adoptionPercentage).toBeLessThanOrEqual(100);
  });

  it('should have adoption percentage greater than 90%', (): void => {
    const stats = getTypeScriptAdoptionStats();

    expect(stats.adoptionPercentage).toBeGreaterThan(90);
  });
});
