import { AddressInputElement } from '@metamask/snaps-sdk/jsx';
import { addressInput } from './address-input';
import { mockTheme } from '../../../../util/theme';

describe('addressInput component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps an AddressInputElement with all props and the parent form', () => {
    const el: AddressInputElement = {
      type: 'AddressInput',
      key: null,
      props: {
        name: 'myAddress',
        chainId: 'eip155:1',
        displayAvatar: true,
        disabled: false,
        placeholder: 'Enter address',
      },
    };

    const result = addressInput({
      ...defaultParams,
      element: el,
      form: 'testForm',
    });

    expect(result).toEqual({
      element: 'SnapUIAddressInput',
      props: {
        name: 'myAddress',
        form: 'testForm',
        chainId: 'eip155:1',
        displayAvatar: true,
        disabled: false,
        placeholder: 'Enter address',
      },
    });
  });

  it('maps when form is undefined and optional props are missing', () => {
    const el: AddressInputElement = {
      type: 'AddressInput',
      key: null,
      props: { name: 'addressInput', chainId: 'eip155:1' },
    };

    const result = addressInput({ ...defaultParams, element: el });

    expect(result.props).toMatchObject({
      name: 'addressInput',
      chainId: 'eip155:1',
      form: undefined,
      displayAvatar: undefined,
      disabled: undefined,
      placeholder: undefined,
    });
  });
});
