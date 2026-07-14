import { Dimensions, PixelRatio } from 'react-native';
import scaling from './scaling';

describe('scaling', () => {
  let dimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    dimensionsSpy = jest.spyOn(Dimensions, 'get');
    jest
      .spyOn(PixelRatio, 'roundToNearestPixel')
      .mockImplementation((value: number) => value);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockWindow = (width: number, height: number) => {
    dimensionsSpy.mockReturnValue({
      width,
      height,
      scale: 1,
      fontScale: 1,
    });
  };

  it('exposes the iPhone 6 base constants', () => {
    expect(scaling.IPHONE_6_WIDTH).toBe(375);
    expect(scaling.IPHONE_6_HEIGHT).toBe(667);
  });

  describe('scale', () => {
    it('returns the original size when the screen matches the base width', () => {
      mockWindow(375, 667);
      expect(scaling.scale(20)).toBe(20);
    });

    it('scales down on a narrower screen', () => {
      // baseScreenSize = 375 (iPhone 6 width), currSize = 300
      // sizeScaled = (300 / 375) * 20 = 16 < 20 -> scaled result returned
      mockWindow(300, 667);
      expect(scaling.scale(20)).toBeCloseTo(16);
    });

    it('does not scale up by default on a wider screen', () => {
      // sizeScaled = (450 / 375) * 20 = 24 > 20, scaleUp defaults to false
      mockWindow(450, 900);
      expect(scaling.scale(20)).toBe(20);
    });

    it('scales up when scaleUp is true', () => {
      mockWindow(450, 900);
      expect(scaling.scale(20, { scaleUp: true })).toBeCloseTo(24);
    });

    it('applies the factor to the scaling delta', () => {
      // sizeScaled = (300 / 375) * 20 = 16, delta = -4, factor 0.5 -> 20 - 2 = 18
      mockWindow(300, 667);
      expect(scaling.scale(20, { factor: 0.5 })).toBeCloseTo(18);
    });

    it('uses baseSize instead of the current screen size when provided', () => {
      mockWindow(300, 667);
      // sizeScaled = (375 / 375) * 20 = 20 -> not less than size, scaleUp false -> 20
      expect(scaling.scale(20, { baseSize: 375 })).toBe(20);
    });

    it('uses the iPhone 11 Pro base width for baseModel 1', () => {
      // baseScreenSize = 375, currSize = 375 -> unchanged
      mockWindow(375, 812);
      expect(scaling.scale(20, { baseModel: 1 })).toBe(20);
    });

    it('uses the iPhone 11 Pro Max base width for baseModel 2', () => {
      // baseScreenSize = 414, currSize = 414 -> sizeScaled = 20
      mockWindow(414, 896);
      expect(scaling.scale(20, { baseModel: 2 })).toBe(20);
    });

    it('takes the smaller dimension as the current width', () => {
      // landscape: width 667 > height 375, CURR_WIDTH = 375 -> unchanged
      mockWindow(667, 375);
      expect(scaling.scale(20)).toBe(20);
    });
  });

  describe('scaleVertical', () => {
    it('scales against the base height', () => {
      // baseScreenSize (height) = 667, currSize (height) = 667 -> unchanged
      mockWindow(375, 667);
      expect(scaling.scaleVertical(30)).toBe(30);
    });

    it('scales down on a shorter screen', () => {
      // currSize (height) = 500, baseScreenSize = 667
      // sizeScaled = (500 / 667) * 30 ≈ 22.49 < 30 -> scaled
      mockWindow(375, 500);
      expect(scaling.scaleVertical(30)).toBeCloseTo((500 / 667) * 30);
    });
  });
});
