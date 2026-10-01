// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionality from './BasicFunctionality';
import renderWithProvider from '../../../util/test/renderWithProvider';

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
    const Component = BasicFunctionality as unknown as React.ComponentType;
    const { toJSON } = renderWithProvider(<Component />);
    expect(toJSON()).toMatchSnapshot();
  });
});
