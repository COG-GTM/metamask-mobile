import React from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <NavigationUnitTest
        {...({
          secondRoute: 'TestScreen2',
        } as unknown as React.ComponentProps<typeof NavigationUnitTest>)}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
