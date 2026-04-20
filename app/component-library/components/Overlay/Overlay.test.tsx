// Third party dependencies.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import Overlay from './Overlay';

describe('Overlay', () => {
  it('renders matches latest snapshot', () => {
    const { toJSON } = render(<Overlay />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a pressable when onPress is provided', () => {
    const onPress = jest.fn();
    const { toJSON, UNSAFE_root } = render(<Overlay onPress={onPress} />);
    expect(toJSON()).toBeTruthy();
    const pressables = UNSAFE_root.findAllByProps({ onPress });
    expect(pressables.length).toBeGreaterThan(0);
    fireEvent.press(pressables[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
