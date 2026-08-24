// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionality from './BasicFunctionality';
import { BasicFunctionalityComponentProps } from './BasicFunctionality.types';
import renderWithProvider from '../../../util/test/renderWithProvider';

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
    // The component is rendered without props, as it was before this file was
    // migrated to TypeScript.
    const props = {} as BasicFunctionalityComponentProps;
    const { toJSON } = renderWithProvider(<BasicFunctionality {...props} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
