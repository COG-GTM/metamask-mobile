import { SelectorElement, SelectorOption, Text } from '@metamask/snaps-sdk/jsx';
import { selector } from './selector';
import { mockTheme } from '../../../../util/theme';

describe('selector component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a SelectorElement to a SnapUISelector with options and form', () => {
    const el: SelectorElement = {
      type: 'Selector',
      key: null,
      props: {
        name: 'pick',
        title: 'Pick one',
        disabled: false,
        children: [
          SelectorOption({
            value: 'a',
            children: Text({ children: 'Option A' }),
          }),
          SelectorOption({
            value: 'b',
            disabled: true,
            children: Text({ children: 'Option B' }),
          }),
        ],
      },
    };

    const result = selector({
      ...defaultParams,
      element: el,
      form: 'theForm',
    });

    expect(result.element).toBe('SnapUISelector');
    expect(result.props).toMatchObject({
      id: 'pick',
      name: 'pick',
      title: 'Pick one',
      disabled: false,
      form: 'theForm',
      options: [
        { value: 'a', disabled: undefined },
        { value: 'b', disabled: true },
      ],
    });
    expect(result.propComponents?.optionComponents).toHaveLength(2);
  });

  it('handles an empty list of options', () => {
    const el: SelectorElement = {
      type: 'Selector',
      key: null,
      props: {
        name: 'empty',
        title: 'No options',
        children: [] as unknown as SelectorElement['props']['children'],
      },
    };

    const result = selector({ ...defaultParams, element: el });
    expect((result.props as { options: unknown[] }).options).toEqual([]);
    expect(result.propComponents?.optionComponents).toEqual([]);
  });
});
