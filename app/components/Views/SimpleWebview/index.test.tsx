import React from 'react';
import { shallow } from 'enzyme';
import SimpleWebview, { SimpleWebviewProps } from './';

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <SimpleWebview
        navigation={
          {
            setParams: () => {
              ('');
            },
            setOptions: () => null,
          } as unknown as SimpleWebviewProps['navigation']
        }
        route={{ params: { url: 'https://etherscan.io', title: 'etherscan' } }}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
