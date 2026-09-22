// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionalityComponent from './BasicFunctionality';
import renderWithProvider from '../../../util/test/renderWithProvider';

const BasicFunctionality =
  BasicFunctionalityComponent as unknown as React.ComponentType;

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(<BasicFunctionality />);
    expect(toJSON()).toMatchSnapshot();
  });
});
