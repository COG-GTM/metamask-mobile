import React from 'react';
import { shallow } from 'enzyme';
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import SimpleWebview from './';

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const navigation = {
      setParams: () => {
        ('');
      },
      setOptions: () => null,
    } as unknown as NavigationProp<ParamListBase>;
    const route = {
      params: { url: 'https://etherscan.io', title: 'etherscan' },
    } as unknown as RouteProp<{ params: { url?: string; title?: string } }, 'params'>;
    const wrapper = shallow(
      <SimpleWebview navigation={navigation} route={route} />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
