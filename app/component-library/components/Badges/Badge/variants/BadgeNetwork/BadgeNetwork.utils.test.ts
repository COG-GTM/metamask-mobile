import getScaledStyles from './BadgeNetwork.utils';

describe('BadgeNetwork.utils getScaledStyles', () => {
  it('returns styles with a scale ratio of 1 when no container size is provided', () => {
    const styles = getScaledStyles(32, null);
    expect(styles.scaleRatio).toBe(1);
    expect(styles.borderWidth).toBeCloseTo(32 / 16);
    expect(styles.height).toBe('50%');
  });

  it('scales the ratio based on container height', () => {
    const styles = getScaledStyles(32, { width: 40, height: 40 });
    expect(styles.scaleRatio).toBe(40 / 32);
  });

  it('exposes min and max bounds derived from AvatarSize values', () => {
    const styles = getScaledStyles(16, null);
    expect(styles.minHeight).toBeGreaterThan(0);
    expect(styles.maxHeight).toBeGreaterThan(styles.minHeight);
  });

  it('computes border width proportional to size', () => {
    const styles = getScaledStyles(48, null);
    expect(styles.borderWidth).toBeCloseTo(48 / 16);
  });
});
