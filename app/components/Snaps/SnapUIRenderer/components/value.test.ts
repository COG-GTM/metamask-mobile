import { ValueElement } from '@metamask/snaps-sdk/jsx';
import { value } from './value';
import { mockTheme } from '../../../../util/theme';

describe('value component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps a ValueElement to ConfirmInfoRowValueDouble with left/right', () => {
    const el: ValueElement = {
      type: 'Value',
      key: null,
      props: {
        value: 'main value',
        extra: 'extra value',
      },
    };

    expect(value({ ...defaultParams, element: el })).toEqual({
      element: 'ConfirmInfoRowValueDouble',
      props: {
        left: 'extra value',
        right: 'main value',
      },
    });
  });

  it('passes through empty strings for extra/value', () => {
    const el: ValueElement = {
      type: 'Value',
      key: null,
      props: {
        value: '',
        extra: '',
      },
    };

    expect(value({ ...defaultParams, element: el })).toEqual({
      element: 'ConfirmInfoRowValueDouble',
      props: { left: '', right: '' },
    });
  });
});
