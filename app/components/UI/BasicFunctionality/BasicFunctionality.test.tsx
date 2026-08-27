// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionality from './BasicFunctionality';
import renderWithProvider from '../../../util/test/renderWithProvider';

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
// @ts-expect-error -- legacy JavaScript UI type boundary
    const { toJSON } = renderWithProvider(<BasicFunctionality />);
    expect(toJSON()).toMatchSnapshot();
  });
});
