// Third party dependencies.
import React from 'react';

// Internal dependencies.
import BasicFunctionality from './BasicFunctionality';
import renderWithProvider from '../../../util/test/renderWithProvider';

describe('BasicFunctionality', () => {
  it('should render correctly', () => {
    // `handleSwitchToggle` is declared as required, but the original render
    // does not provide one.
    const props = {} as React.ComponentProps<typeof BasicFunctionality>;
    const { toJSON } = renderWithProvider(<BasicFunctionality {...props} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
