import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import BannerBase from './BannerBase';

describe('BannerBase', () => {
  it('renders correctly with children', () => {
    const { toJSON } = render(
      <BannerBase>
        <Text>Banner content</Text>
      </BannerBase>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <BannerBase>
        <Text>Banner content</Text>
      </BannerBase>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
