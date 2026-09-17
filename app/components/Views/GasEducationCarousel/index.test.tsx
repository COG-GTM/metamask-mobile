import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
