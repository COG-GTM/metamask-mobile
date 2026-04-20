// Third party dependencies.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import SheetActions from './SheetActions';

describe('SheetActions', () => {
  it('renders a single action and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SheetActions actions={[{ label: 'Only', onPress }]} />,
    );
    fireEvent.press(getByText('Only'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a separator between multiple actions', () => {
    const { toJSON } = render(
      <SheetActions
        actions={[
          { label: 'First', onPress: jest.fn() },
          { label: 'Second', onPress: jest.fn() },
        ]}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('disables the button when isLoading or disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SheetActions
        actions={[
          { label: 'Loading', onPress, isLoading: true },
          { label: 'Disabled', onPress, disabled: true },
        ]}
      />,
    );
    fireEvent.press(getByText('Loading'));
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
