import { AvatarElement } from '@metamask/snaps-sdk/jsx';
import { avatar } from './avatar';
import { mockTheme } from '../../../../util/theme';

describe('avatar component mapper', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme,
  };

  it('maps an AvatarElement to SnapUIAvatar with its address and size', () => {
    const el: AvatarElement = {
      type: 'Avatar',
      key: null,
      props: {
        address: 'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
        size: 'lg',
      },
    };

    const result = avatar({ ...defaultParams, element: el });

    expect(result).toEqual({
      element: 'SnapUIAvatar',
      props: {
        address: 'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
        size: 'lg',
      },
    });
  });

  it('passes through an undefined size', () => {
    const el: AvatarElement = {
      type: 'Avatar',
      key: null,
      props: {
        address: 'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
      },
    };

    const result = avatar({ ...defaultParams, element: el });

    expect(result.props?.size).toBeUndefined();
    expect(result.props?.address).toBe(
      'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
    );
  });
});
