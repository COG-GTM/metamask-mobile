// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import Loader from './Loader';

describe('Loader', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<Loader />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('accepts a custom size prop', () => {
    const { toJSON } = render(<Loader size="small" />);
    expect(toJSON()).toBeTruthy();
  });

  it('accepts a custom color prop', () => {
    const { toJSON } = render(<Loader color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });
});
