import React, { ReactNode, useCallback } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import Keypad from './components';
import { KEYS } from './constants';
import useCurrency from './useCurrency';

export interface KeypadChange {
  value: string;
  valueAsNumber: number;
  pressedKey: string;
}

interface KeypadComponentProps {
  /**
   * Function that will be called when a key is pressed with arguments `(value, key)`
   */
  onChange?: (change: KeypadChange) => void;
  /**
   * Currency code for the keypad rules and symbols. Defaults to
   * currency without decimals (CURRENCIES[default])
   */
  currency?: string;
  /**
   * Currency decimals
   */
  decimals?: number;
  /**
   * Current value used to create new value when a key is pressed.
   */
  value?: string;
  /**
   * Custom style for container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom style for digit buttons
   */
  digitButtonStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for digit text
   */
  digitTextStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for period button
   */
  periodButtonStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for period text
   */
  periodTextStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for delete button
   */
  deleteButtonStyle?: StyleProp<ViewStyle>;
  /**
   * Custom icon for delete button
   */
  deleteIcon?: ReactNode;
}

function KeypadComponent({
  onChange,
  value,
  currency,
  decimals,
  style,
  digitButtonStyle,
  digitTextStyle,
  periodButtonStyle,
  periodTextStyle,
  deleteButtonStyle,
  deleteIcon,
}: KeypadComponentProps) {
  const { handler, decimalSeparator } = useCurrency(currency, decimals);
  const handleKeypadPress = useCallback(
    (pressedKey: string) => {
      const newValue = handler(value, pressedKey);
      let valueAsNumber = 0;
      try {
        valueAsNumber = Number(
          decimalSeparator ? newValue.replace(decimalSeparator, '.') : newValue,
        );
      } catch (error) {
        console.error(error);
      }
      onChange?.({ value: newValue, valueAsNumber, pressedKey });
    },
    [decimalSeparator, handler, onChange, value],
  );
  const handleKeypadPress1 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_1),
    [handleKeypadPress],
  );
  const handleKeypadPress2 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_2),
    [handleKeypadPress],
  );
  const handleKeypadPress3 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_3),
    [handleKeypadPress],
  );
  const handleKeypadPress4 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_4),
    [handleKeypadPress],
  );
  const handleKeypadPress5 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_5),
    [handleKeypadPress],
  );
  const handleKeypadPress6 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_6),
    [handleKeypadPress],
  );
  const handleKeypadPress7 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_7),
    [handleKeypadPress],
  );
  const handleKeypadPress8 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_8),
    [handleKeypadPress],
  );
  const handleKeypadPress9 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_9),
    [handleKeypadPress],
  );
  const handleKeypadPress0 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_0),
    [handleKeypadPress],
  );
  const handleKeypadPressPeriod = useCallback(
    () => decimalSeparator && handleKeypadPress(KEYS.PERIOD),
    [decimalSeparator, handleKeypadPress],
  );
  const handleKeypadPressBack = useCallback(
    () => handleKeypadPress(KEYS.BACK),
    [handleKeypadPress],
  );
  const handleKeypadLongPressBack = useCallback(
    () => handleKeypadPress(KEYS.INITIAL),
    [handleKeypadPress],
  );

  return (
    <Keypad style={style}>
      <Keypad.Row>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress1}
          accessibilityRole="button"
          accessible
        >
          1
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress2}
          accessibilityRole="button"
          accessible
        >
          2
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress3}
          accessibilityRole="button"
          accessible
        >
          3
        </Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress4}
          accessibilityRole="button"
          accessible
        >
          4
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress5}
          accessibilityRole="button"
          accessible
        >
          5
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress6}
          accessibilityRole="button"
          accessible
        >
          6
        </Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress7}
          accessibilityRole="button"
          accessible
        >
          7
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress8}
          accessibilityRole="button"
          accessible
        >
          8
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress9}
          accessibilityRole="button"
          accessible
        >
          9
        </Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button
          style={periodButtonStyle}
          textStyle={periodTextStyle}
          onPress={handleKeypadPressPeriod}
        >
          {decimalSeparator}
        </Keypad.Button>
        <Keypad.Button
          style={digitButtonStyle}
          textStyle={digitTextStyle}
          onPress={handleKeypadPress0}
          accessibilityRole="button"
          accessible
        >
          0
        </Keypad.Button>
        <Keypad.DeleteButton
          testID="keypad-delete-button"
          style={deleteButtonStyle}
          icon={deleteIcon}
          onPress={handleKeypadPressBack}
          onLongPress={handleKeypadLongPressBack}
          delayLongPress={500}
        />
      </Keypad.Row>
    </Keypad>
  );
}

export { KEYS };
export default KeypadComponent;
