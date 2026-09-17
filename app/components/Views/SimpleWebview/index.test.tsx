import React from 'react';
import { shallow } from 'enzyme';
import SimpleWebview from './';

const SimpleWebviewComponent = SimpleWebview as unknown as React.ComponentType<
  Record<string, unknown>
>;

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <SimpleWebviewComponent
        navigation={{
          setParams: () => {
            ('');
          },
          setOptions: () => null,
        }}
        route={{ params: { url: 'https://etherscan.io', title: 'etherscan' } }}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
