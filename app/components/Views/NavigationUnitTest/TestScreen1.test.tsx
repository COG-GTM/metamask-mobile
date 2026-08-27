import React from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <NavigationUnitTest firstRoute={'TestScreen1'} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
