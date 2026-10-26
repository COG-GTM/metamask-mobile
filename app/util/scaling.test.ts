import { Dimensions, PixelRatio } from 'react-native';
import scaling from './scaling';

type ScaleOptions = Parameters<typeof scaling.scale>[1];

const mockWindow = (width: number, height: number) =>
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height, scale: 1, fontScale: 1 });

describe('scaling', () => {
  beforeEach(() => {
    jest
      .spyOn(PixelRatio, 'roundToNearestPixel')
      .mockImplementation((value: number) => value);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes base model constants', () => {
    expect(scaling.IPHONE_6_WIDTH).toBe(375);
    expect(scaling.IPHONE_6_HEIGHT).toBe(667);
  });

  it('scales down on smaller screens', () => {
    mockWindow(187.5, 333.5);
    expect(scaling.scale(10)).toBe(5);
  });

  it('does not scale up on larger screens by default', () => {
    mockWindow(750, 1334);
    expect(scaling.scale(10)).toBe(10);
  });

  it('scales up on larger screens when scaleUp is true', () => {
    mockWindow(750, 1334);
    expect(scaling.scale(10, { scaleUp: true } as ScaleOptions)).toBe(20);
  });

  it('applies the scale factor', () => {
    mockWindow(187.5, 333.5);
    expect(scaling.scale(10, { factor: 0.5 } as ScaleOptions)).toBe(7.5);
  });

  it('uses the base size when provided', () => {
    mockWindow(750, 1334);
    expect(scaling.scale(10, { baseSize: 187.5 } as unknown as ScaleOptions)).toBe(5);
  });

  it('handles landscape orientation', () => {
    mockWindow(333.5, 187.5);
    expect(scaling.scale(10)).toBe(5);
  });

  it('uses base model 1 dimensions', () => {
    mockWindow(187.5, 406);
    expect(scaling.scale(10, { baseModel: 1 })).toBe(5);
    expect(scaling.scaleVertical(10, { baseModel: 1 })).toBe(5);
  });

  it('uses base model 2 dimensions', () => {
    mockWindow(207, 448);
    expect(scaling.scale(10, { baseModel: 2 })).toBe(5);
    expect(scaling.scaleVertical(10, { baseModel: 2 })).toBe(5);
  });

  it('scales vertically', () => {
    mockWindow(187.5, 333.5);
    expect(scaling.scaleVertical(10)).toBe(5);
  });
});
