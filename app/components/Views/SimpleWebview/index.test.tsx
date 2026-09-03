import React from 'react';
import { shallow } from 'enzyme';
import SimpleWebview from './';
import type {
  NavigationProp,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import type { WebviewParams } from './SimpleWebview.types';

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
        route={
          {
            params: { url: 'https://etherscan.io', title: 'etherscan' },
          } as unknown as RouteProp<{ params: WebviewParams }, 'params'>
        }
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
