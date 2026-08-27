import React from 'react';
import NavigationUnitTest from '.';
import { render } from '@testing-library/react-native';

describe('NavigationUnitTest', () => {
  it('should render correctly', () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { toJSON } = render(<NavigationUnitTest />);
    expect(toJSON()).toMatchSnapshot();
  });
});
