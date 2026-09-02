import React from 'react';
import { shallow } from 'enzyme';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import SimpleWebview from './';

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
          } as unknown as NavigationProp<ParamListBase>
        }
        route={{ params: { url: 'https://etherscan.io', title: 'etherscan' } }}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
