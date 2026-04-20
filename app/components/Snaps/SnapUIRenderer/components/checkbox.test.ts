import { CheckboxElement } from '@metamask/snaps-sdk/jsx';
import { checkbox } from './checkbox';
import { mockTheme } from '../../../../util/theme';

describe('checkbox component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a CheckboxElement with all props and a parent form', () => {
    const el: CheckboxElement = {
      type: 'Checkbox',
      key: null,
      props: {
        name: 'agree',
        label: 'I agree',
        variant: 'default',
        disabled: false,
      },
    };

    expect(
      checkbox({ ...defaultParams, element: el, form: 'consentForm' }),
    ).toEqual({
      element: 'SnapUICheckbox',
      props: {
        name: 'agree',
        label: 'I agree',
        variant: 'default',
        disabled: false,
        form: 'consentForm',
      },
    });
  });

  it('passes through undefined label/variant and no form', () => {
    const el: CheckboxElement = {
      type: 'Checkbox',
      key: null,
      props: { name: 'agree' },
    };

    const result = checkbox({ ...defaultParams, element: el });
    expect(result.props).toEqual({
      name: 'agree',
      label: undefined,
      variant: undefined,
      disabled: undefined,
      form: undefined,
    });
  });
});
