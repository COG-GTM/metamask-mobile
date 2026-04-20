import {
  AddressInput,
  Checkbox,
  FieldElement,
  Input,
  Selector,
  SelectorOption,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { field } from './field';
import { mockTheme } from '../../../../util/theme';

describe('field component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps an AddressInput Field to a SnapUIAddressInput with label and error', () => {
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'To',
        error: 'bad',
        children: AddressInput({
          name: 'to',
          chainId: 'eip155:1',
        }),
      },
    };

    const result = field({ ...defaultParams, element: el, form: 'send' });

    expect(result.element).toBe('SnapUIAddressInput');
    expect(result.props).toMatchObject({
      name: 'to',
      form: 'send',
      chainId: 'eip155:1',
      label: 'To',
      error: 'bad',
    });
  });

  it('maps an Input Field without accessories to SnapUIInput', () => {
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'Name',
        children: Input({ name: 'name', placeholder: 'Enter' }),
      },
    };

    const result = field({ ...defaultParams, element: el });
    expect(result.element).toBe('SnapUIInput');
    expect(result.props).toMatchObject({
      id: 'name',
      name: 'name',
      label: 'Name',
      placeholder: 'Enter',
    });
    expect(result.propComponents?.startAccessory).toBeUndefined();
    expect(result.propComponents?.endAccessory).toBeUndefined();
  });

  it('maps an Input Field with a right accessory', () => {
    const rightAccessory = Text({ children: 'ETH' });
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'Amount',
        children: [Input({ name: 'amount' }), rightAccessory],
      },
    };

    const result = field({ ...defaultParams, element: el });
    expect(result.element).toBe('SnapUIInput');
    expect(result.propComponents?.endAccessory).toBeDefined();
    expect(result.propComponents?.startAccessory).toBeUndefined();
  });

  it('maps an Input Field with left and right accessories', () => {
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'Amount',
        children: [
          Text({ children: '$' }),
          Input({ name: 'amount' }),
          Text({ children: 'USD' }),
        ],
      },
    };

    const result = field({ ...defaultParams, element: el });
    expect(result.propComponents?.startAccessory).toBeDefined();
    expect(result.propComponents?.endAccessory).toBeDefined();
  });

  it('maps a Checkbox Field to SnapUICheckbox with fieldLabel', () => {
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'Agree',
        children: Checkbox({ name: 'agree' }),
      },
    };

    const result = field({ ...defaultParams, element: el, form: 'agrees' });
    expect(result.element).toBe('SnapUICheckbox');
    expect(result.props).toMatchObject({
      name: 'agree',
      fieldLabel: 'Agree',
      form: 'agrees',
    });
  });

  it('maps a Selector Field to SnapUISelector', () => {
    const el: FieldElement = {
      type: 'Field',
      key: null,
      props: {
        label: 'Choose',
        children: Selector({
          name: 'choice',
          title: 't',
          children: [
            SelectorOption({
              value: 'a',
              children: Text({ children: 'A' }),
            }),
          ],
        }),
      },
    };

    const result = field({ ...defaultParams, element: el, form: 'f' });
    expect(result.element).toBe('SnapUISelector');
    expect(result.props).toMatchObject({
      name: 'choice',
      label: 'Choose',
      form: 'f',
    });
  });

  it('throws for unsupported child types', () => {
    const el = {
      type: 'Field',
      key: null,
      props: {
        label: 'Bad',
        children: {
          type: 'SomethingUnsupported',
          key: null,
          props: {},
        },
      },
    } as unknown as FieldElement;

    expect(() => field({ ...defaultParams, element: el })).toThrow();
  });
});
