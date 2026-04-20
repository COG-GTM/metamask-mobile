// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import SelectorButton from './SelectorButton';

describe('SelectorButton', () => {
  it('renders children and a caret-down icon', () => {
    const { getByText, toJSON } = render(
      <SelectorButton onPress={jest.fn()}>
        <RNText>Pick me</RNText>
      </SelectorButton>,
    );
    expect(getByText('Pick me')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SelectorButton onPress={onPress}>
        <RNText>Press</RNText>
      </SelectorButton>,
    );
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SelectorButton onPress={onPress} disabled>
        <RNText>Disabled</RNText>
      </SelectorButton>,
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
