import { ButtonElement } from '@metamask/snaps-sdk/jsx';
import { button } from './button';
import { TextVariant } from '../../../../component-library/components/Texts/Text';
import { mockTheme } from '../../../../util/theme';

describe('button component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a ButtonElement with text children to SnapUIButton', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        type: 'submit',
        variant: 'primary',
        children: 'Submit',
      },
    };

    const result = button({ ...defaultParams, element: el, form: 'myForm' });

    expect(result.element).toBe('SnapUIButton');
    expect(result.props).toEqual({
      type: 'submit',
      form: 'myForm',
      variant: 'primary',
      name: 'submit',
      disabled: undefined,
      loading: false,
    });
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('uses the form from element.props over the parent form', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        form: 'innerForm',
        children: 'Submit',
      },
    };

    const result = button({ ...defaultParams, element: el, form: 'outerForm' });
    expect(result.props?.form).toBe('innerForm');
  });

  it('uses muted color when disabled', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        disabled: true,
        children: 'Submit',
      },
    };

    const result = button({ ...defaultParams, element: el });
    const firstChild = (result.children as { props: { color: string } }[])[0];
    expect(firstChild.props.color).toBe(mockTheme.colors.text.muted);
  });

  it('uses error color when variant is destructive', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        variant: 'destructive',
        children: 'Delete',
      },
    };

    const result = button({ ...defaultParams, element: el });
    const firstChild = (result.children as { props: { color: string } }[])[0];
    expect(firstChild.props.color).toBe(mockTheme.colors.error.default);
  });

  it('uses the small text variant when size is sm', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        size: 'sm',
        children: 'Small',
      },
    };

    const result = button({ ...defaultParams, element: el });
    const firstChild = (result.children as { props: { variant: string } }[])[0];
    expect(firstChild.props.variant).toBe(TextVariant.BodySMMedium);
  });

  it('uses the medium text variant by default', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'submit',
        children: 'Default',
      },
    };

    const result = button({ ...defaultParams, element: el });
    const firstChild = (result.children as { props: { variant: string } }[])[0];
    expect(firstChild.props.variant).toBe(TextVariant.BodyMDMedium);
  });

  it('defaults loading to false when not provided', () => {
    const el: ButtonElement = {
      type: 'Button',
      key: null,
      props: {
        name: 'btn',
        children: 'Click me',
      },
    };

    const result = button({ ...defaultParams, element: el });
    expect(result.props?.loading).toBe(false);
  });
});
