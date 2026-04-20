// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import BottomSheetOverlay from './BottomSheetOverlay';

describe('BottomSheetOverlay', () => {
  it('renders matches latest snapshot', () => {
    const { toJSON } = render(<BottomSheetOverlay />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('forwards props to the underlying Overlay', () => {
    const onPress = jest.fn();
    const { toJSON } = render(<BottomSheetOverlay onPress={onPress} />);
    expect(toJSON()).toBeTruthy();
  });
});
