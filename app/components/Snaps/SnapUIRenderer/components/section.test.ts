import { SectionElement, Text } from '@metamask/snaps-sdk/jsx';
import { section } from './section';
import { mockTheme } from '../../../../util/theme';

describe('section component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a SectionElement to a Box with alternative background color', () => {
    const el: SectionElement = {
      type: 'Section',
      key: null,
      props: {
        children: Text({ children: 'Hi' }),
      },
    };

    const result = section({ ...defaultParams, element: el });

    expect(result.element).toBe('Box');
    expect(result.props).toMatchObject({
      padding: 16,
      gap: 8,
      borderRadius: 8,
      backgroundColor: mockTheme.colors.background.alternative,
    });
    expect(Array.isArray(result.children)).toBe(true);
  });
});
