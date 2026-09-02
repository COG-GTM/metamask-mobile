import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

const mockNavigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
} as unknown as NavigationProp<ParamListBase> & { pop: () => void };

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OfflineMode navigation={mockNavigation} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
