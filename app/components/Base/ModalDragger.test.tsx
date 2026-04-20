// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import ModalDragger from './ModalDragger';

describe('ModalDragger', () => {
  it('renders with default props (bordered)', () => {
    const { toJSON } = render(<ModalDragger />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without a border when borderless is true', () => {
    const { toJSON } = render(<ModalDragger borderless />);
    expect(toJSON()).toBeTruthy();
  });
});
