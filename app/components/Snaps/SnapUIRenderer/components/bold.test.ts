import { BoldElement } from '@metamask/snaps-sdk/jsx';
import { bold } from './bold';
import { TextVariant } from '../../../../component-library/components/Texts/Text';
import { mockTheme } from '../../../../util/theme';

describe('bold component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a BoldElement with string children to a bold Text template', () => {
    const el: BoldElement = {
      type: 'Bold',
      key: null,
      props: {
        children: 'Important!',
      },
    };

    const result = bold({ ...defaultParams, element: el });

    expect(result.element).toBe('Text');
    expect(result.props).toEqual({
      variant: TextVariant.BodyMDBold,
      color: undefined,
      numberOfLines: 0,
      flexWrap: 'wrap',
    });
    expect(Array.isArray(result.children)).toBe(true);
    const [first] = result.children as { element: string; children: string }[];
    expect(first.element).toBe('Text');
    expect(first.children).toBe('Important!');
  });

  it('uses the inherited textColor for the bold variant', () => {
    const el: BoldElement = {
      type: 'Bold',
      key: null,
      props: { children: 'Warning!' },
    };

    const result = bold({
      ...defaultParams,
      element: el,
      textColor: 'warning',
    });

    expect(result.props?.color).toBe('warning');
  });
});
