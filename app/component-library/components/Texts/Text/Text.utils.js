import { typography } from '@metamask/design-tokens';


export const getFontFamily = (
variant,
fontWeight,
fontStyle) =>
{
  const resolvedWeight = fontWeight ?? typography[variant].fontWeight;
  const resolvedStyle = fontStyle ?? 'normal';

  const weightToFontSuffix = {
    '100': 'Book',
    '200': 'Book',
    '300': 'Book',
    '400': 'Book',
    '500': 'Medium',
    '600': 'Medium',
    '700': 'Bold',
    '800': 'Bold',
    '900': 'Bold',
    normal: 'Book',
    bold: 'Bold'
  };

  const fontSuffix = weightToFontSuffix[resolvedWeight];
  const italicSuffix = resolvedStyle === 'italic' ? 'Italic' : '';

  return `CentraNo1-${fontSuffix}${italicSuffix}`;
};