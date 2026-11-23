// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionality from './BasicFunctionality';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { BasicFunctionalityComponentProps } from './BasicFunctionality.types';

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <BasicFunctionality {...({} as BasicFunctionalityComponentProps)} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
