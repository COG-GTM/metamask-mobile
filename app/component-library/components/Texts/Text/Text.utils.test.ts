import { getFontFamily } from './Text.utils';
import { FontStyle, FontWeight, TextVariant } from './Text.types';

describe('getFontFamily', () => {
  it('returns a Book font for a body variant by default', () => {
    expect(getFontFamily(TextVariant.BodyMD)).toBe('CentraNo1-Book');
  });

  it('uses a Medium suffix when fontWeight is 500', () => {
    expect(getFontFamily(TextVariant.BodyMD, '500')).toBe('CentraNo1-Medium');
  });

  it('uses a Bold suffix when fontWeight is 700', () => {
    expect(getFontFamily(TextVariant.BodyMD, '700')).toBe('CentraNo1-Bold');
  });

  it('appends Italic when fontStyle is italic', () => {
    expect(
      getFontFamily(TextVariant.BodyMD, '500', 'italic' as FontStyle),
    ).toBe('CentraNo1-MediumItalic');
  });

  it('maps all numeric and named font weights to a suffix', () => {
    const weights: FontWeight[] = [
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      'normal',
      'bold',
    ];
    for (const weight of weights) {
      const result = getFontFamily(TextVariant.BodyMD, weight);
      expect(result).toMatch(/^CentraNo1-(Book|Medium|Bold)$/);
    }
  });

  it('defaults to the variant typography font weight when not provided', () => {
    // BodyMDBold should map to a Bold suffix via its typography definition.
    expect(getFontFamily(TextVariant.BodyMDBold)).toBe('CentraNo1-Bold');
  });
});
