import React from 'react';
import type { ParamListBase } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const navigation = {
      pop: jest.fn(),
      navigate: jest.fn(),
    } as unknown as StackNavigationProp<ParamListBase>;
    const { toJSON } = renderWithProvider(
      <OfflineMode navigation={navigation} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
