import scaling from './scaling';

describe('scaling', () => {
  it('exports scale function', () => {
    expect(typeof scaling.scale).toBe('function');
  });

  it('exports scaleVertical function', () => {
    expect(typeof scaling.scaleVertical).toBe('function');
  });

  it('exports IPHONE_6_WIDTH constant', () => {
    expect(scaling.IPHONE_6_WIDTH).toBe(375);
  });

  it('exports IPHONE_6_HEIGHT constant', () => {
    expect(scaling.IPHONE_6_HEIGHT).toBe(667);
  });

  it('scale returns a number', () => {
    const result = scaling.scale(16);
    expect(typeof result).toBe('number');
  });

  it('scale with factor option returns a number', () => {
    const result = scaling.scale(16, { factor: 0.5 });
    expect(typeof result).toBe('number');
  });

  it('scaleVertical returns a number', () => {
    const result = scaling.scaleVertical(16);
    expect(typeof result).toBe('number');
  });

  it('scale with baseModel 1 returns a number', () => {
    const result = scaling.scale(16, { baseModel: 1 });
    expect(typeof result).toBe('number');
  });

  it('scale with baseModel 2 returns a number', () => {
    const result = scaling.scale(16, { baseModel: 2 });
    expect(typeof result).toBe('number');
  });

  it('scale with scaleUp option returns a number', () => {
    const result = scaling.scale(16, { scaleUp: true });
    expect(typeof result).toBe('number');
  });

  it('scale with baseSize option returns a number', () => {
    const result = scaling.scale(16, { baseSize: 400 });
    expect(typeof result).toBe('number');
  });
});
