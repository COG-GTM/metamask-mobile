import { Dimensions, PixelRatio } from 'react-native';
import scaling from './scaling';

describe('scaling', () => {
  let dimensionsSpy;
  let roundSpy;

  beforeEach(() => {
    dimensionsSpy = jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 375, height: 667 });
    roundSpy = jest
      .spyOn(PixelRatio, 'roundToNearestPixel')
      .mockImplementation((v) => Math.round(v));
  });

  afterEach(() => {
    dimensionsSpy.mockRestore();
    roundSpy.mockRestore();
  });

  it('exposes iPhone 6 width and height constants', () => {
    expect(scaling.IPHONE_6_WIDTH).toBe(375);
    expect(scaling.IPHONE_6_HEIGHT).toBe(667);
  });

  it('scale returns the same size when screen matches base model (iPhone 6)', () => {
    expect(scaling.scale(16)).toBe(16);
  });

  it('scale with a smaller screen scales the size down', () => {
    dimensionsSpy.mockReturnValue({ width: 320, height: 568 });
    expect(scaling.scale(20)).toBeLessThan(20);
  });

  it('scale does not scale up by default when screen is larger than base', () => {
    dimensionsSpy.mockReturnValue({ width: 414, height: 896 });
    expect(scaling.scale(10)).toBe(10);
  });

  it('scale with scaleUp=true scales up on larger screens', () => {
    dimensionsSpy.mockReturnValue({ width: 414, height: 896 });
    expect(scaling.scale(10, { scaleUp: true })).toBeGreaterThan(10);
  });

  it('scaleVertical scales relative to height', () => {
    dimensionsSpy.mockReturnValue({ width: 375, height: 568 });
    expect(scaling.scaleVertical(20)).toBeLessThan(20);
  });

  it('supports baseModel option for larger iPhone baselines', () => {
    dimensionsSpy.mockReturnValue({ width: 375, height: 812 });
    expect(scaling.scale(16, { baseModel: 1 })).toBe(16);
    expect(scaling.scale(16, { baseModel: 2 })).toBeLessThan(16);
  });
});
