import React from 'react';
import { render } from '@testing-library/react-native';
import Avatar from './Avatar';
import { AvatarVariant } from './Avatar.types';
import { IconName } from '../../Icons/Icon';

describe('Avatar', () => {
  it('renders icon variant correctly', () => {
    const { toJSON } = render(
      <Avatar variant={AvatarVariant.Icon} name={IconName.Send} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <Avatar variant={AvatarVariant.Icon} name={IconName.Send} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
