// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import Keypad from './components';

describe('Keypad compound components', () => {
  it('renders the container, rows, buttons, and delete button', () => {
    const onDigitPress = jest.fn();
    const onDeletePress = jest.fn();

    const { getByText, toJSON } = render(
      <Keypad>
        <Keypad.Row>
          <Keypad.Button onPress={onDigitPress}>1</Keypad.Button>
          <Keypad.Button onPress={onDigitPress}>2</Keypad.Button>
          <Keypad.DeleteButton
            accessibilityLabel="delete"
            onPress={onDeletePress}
          />
        </Keypad.Row>
      </Keypad>,
    );

    fireEvent.press(getByText('1'));
    expect(onDigitPress).toHaveBeenCalledTimes(1);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a custom delete icon when provided', () => {
    const { getByText } = render(
      <Keypad.DeleteButton icon={<RNText>X</RNText>} />,
    );
    expect(getByText('X')).toBeTruthy();
  });
});
