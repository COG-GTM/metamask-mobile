// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// External dependencies.
import { IconName } from '../../Icons/Icon';

// Internal dependencies.
import Avatar from './Avatar';
import { AvatarVariant } from './Avatar.types';
import { AvatarSize } from './Avatar.constants';

describe('Avatar', () => {
  it('renders the Account variant', () => {
    const { toJSON } = render(
      <Avatar
        variant={AvatarVariant.Account}
        accountAddress="0x1234567890123456789012345678901234567890"
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the Icon variant', () => {
    const { toJSON } = render(
      <Avatar
        variant={AvatarVariant.Icon}
        name={IconName.Bank}
        size={AvatarSize.Md}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the Favicon variant', () => {
    const { toJSON } = render(
      <Avatar
        variant={AvatarVariant.Favicon}
        imageSource={{ uri: 'https://example.com/icon.png' }}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the Network variant', () => {
    const { toJSON } = render(
      <Avatar
        variant={AvatarVariant.Network}
        name="Ethereum"
        imageSource={{ uri: 'https://example.com/eth.png' }}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the Token variant', () => {
    const { toJSON } = render(
      <Avatar
        variant={AvatarVariant.Token}
        name="ETH"
        imageSource={{ uri: 'https://example.com/eth.png' }}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('throws when variant is invalid', () => {
    expect(() =>
      render(
        // @ts-expect-error intentionally invalid
        <Avatar variant={'unknown'} />,
      ),
    ).toThrow('Invalid Avatar Variant');
  });
});
