import { RowElement, Text } from '@metamask/snaps-sdk/jsx';
import { mockTheme } from '../../../../util/theme';

jest.mock('../utils', () => ({
  mapToTemplate: jest.fn(({ element }) => ({
    element: `Mapped-${element.type}`,
    props: { color: element.props?.color },
  })),
}));

// eslint-disable-next-line import/first
import { row, RowVariant } from './row';

describe('row component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a RowElement to a SnapUIInfoRow with the label and variant', () => {
    const el: RowElement = {
      type: 'Row',
      key: null,
      props: {
        label: 'Amount',
        variant: RowVariant.Default,
        tooltip: 'A tooltip',
        children: Text({ children: 'Hello' }),
      },
    };

    const result = row({ ...defaultParams, element: el });

    expect(result.element).toBe('SnapUIInfoRow');
    expect(result.props).toMatchObject({
      label: 'Amount',
      variant: RowVariant.Default,
      tooltip: 'A tooltip',
    });
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('maps Critical variant Text children to error color when unset', () => {
    const el: RowElement = {
      type: 'Row',
      key: null,
      props: {
        label: 'Alert',
        variant: RowVariant.Critical,
        children: Text({ children: 'Bad' }),
      },
    };

    const result = row({ ...defaultParams, element: el });
    const [firstChild] = result.children as {
      props?: { color?: string };
    }[];

    expect(firstChild.props?.color).toBe('error');
  });

  it('maps Warning variant Text children to warning color when unset', () => {
    const el: RowElement = {
      type: 'Row',
      key: null,
      props: {
        label: 'Heads-up',
        variant: RowVariant.Warning,
        children: Text({ children: 'Careful' }),
      },
    };

    const result = row({ ...defaultParams, element: el });
    const [firstChild] = result.children as {
      props?: { color?: string };
    }[];
    expect(firstChild.props?.color).toBe('warning');
  });

  it('leaves non-Text children untouched', () => {
    const bold = {
      type: 'Bold',
      key: null,
      props: { children: 'Hello' },
    } as unknown as RowElement['props']['children'];

    const el: RowElement = {
      type: 'Row',
      key: null,
      props: {
        label: 'Custom',
        variant: RowVariant.Critical,
        children: bold,
      },
    };

    const result = row({ ...defaultParams, element: el });
    expect(result.children).toHaveLength(1);
  });
});
