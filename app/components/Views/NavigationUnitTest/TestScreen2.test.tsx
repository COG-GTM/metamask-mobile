import React from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

const NavigationUnitTestWithProps = NavigationUnitTest as React.ComponentType<{
  secondRoute: string;
}>;

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <NavigationUnitTestWithProps secondRoute="TestScreen2" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
