import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OfflineMode
        navigation={{} as StackNavigationProp<ParamListBase>}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
