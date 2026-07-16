import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={
          {
            getParam: () => false,
            setOptions: () => null,
          } as unknown as StackNavigationProp<ParamListBase>
        }
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
