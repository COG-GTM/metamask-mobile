import React from 'react';
import SimpleWebview from './';

import { render } from '@testing-library/react-native';
describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <SimpleWebview
        navigation={{
          setParams: () => {
            ('');
          },
          setOptions: () => null,
        }}
        route={{ params: { url: 'https://etherscan.io', title: 'etherscan' } }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
