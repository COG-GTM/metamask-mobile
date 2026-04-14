import scaling from './scaling';

describe('scaling', () => {
  it('should export scale function', () => {
    expect(typeof scaling.scale).toBe('function');
  });

  it('should export scaleVertical function', () => {
    expect(typeof scaling.scaleVertical).toBe('function');
  });

  it('should export IPHONE_6 dimensions', () => {
    expect(scaling.IPHONE_6_WIDTH).toBe(375);
    expect(scaling.IPHONE_6_HEIGHT).toBe(667);
  });

  it('scale should return a number', () => {
    const result = scaling.scale(16);
    expect(typeof result).toBe('number');
  });

  it('scaleVertical should return a number', () => {
    const result = scaling.scaleVertical(16);
    expect(typeof result).toBe('number');
  });
});
