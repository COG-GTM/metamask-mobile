import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OfflineMode
        navigation={{} as unknown as StackNavigationProp<ParamListBase>}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
