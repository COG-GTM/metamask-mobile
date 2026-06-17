import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

const mockNavigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
} as unknown as StackNavigationProp<ParamListBase>;

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OfflineMode navigation={mockNavigation} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
