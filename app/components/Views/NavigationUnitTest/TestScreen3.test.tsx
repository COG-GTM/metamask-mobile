import React, { ComponentType } from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

interface NavigationUnitTestProps {
  firstRoute?: string;
  secondRoute?: string;
}

const NavigationUnitTestComponent =
  NavigationUnitTest as ComponentType<NavigationUnitTestProps>;

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    const { toJSON } = render(<NavigationUnitTestComponent />);
    expect(toJSON()).toMatchSnapshot();
  });
});
