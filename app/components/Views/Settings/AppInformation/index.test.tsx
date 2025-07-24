import React from 'react';
import { renderScreen } from '../../../../util/test/renderWithProvider';
import AppInformation from './';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
} as unknown as NavigationProp<ParamListBase>;

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      () => <AppInformation navigation={mockNavigation} />,
      { name: 'AppInformation' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
