import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import BigNumber from 'bignumber.js';
import RangeInput from './RangeInput';

const NAME = 'Gas limit';

const renderRangeInput = (
  props: Record<string, unknown> = {},
  options: Parameters<typeof render>[1] = {},
) => {
  const onChangeValue = jest.fn();
  const utils = render(
    <RangeInput
      name={NAME}
      value="5"
      min={new BigNumber(1)}
      max={new BigNumber(10)}
      onChangeValue={onChangeValue}
      {...props}
    />,
    options,
  );
  const [minusButton, plusButton] =
    screen.UNSAFE_getAllByType(TouchableOpacity);
  const input = screen.UNSAFE_getByType(TextInput);
  return { ...utils, onChangeValue, minusButton, plusButton, input };
};

describe('RangeInput', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not call onChangeValue on mount when value is within limits', () => {
    const { onChangeValue } = renderRangeInput();

    expect(onChangeValue).not.toHaveBeenCalled();
    expect(screen.queryByText(new RegExp(NAME))).toBeNull();
  });

  describe('typing', () => {
    it('normalises a comma decimal separator to a dot', () => {
      const { input, onChangeValue } = renderRangeInput();

      fireEvent.changeText(input, '1,5');

      expect(onChangeValue).toHaveBeenCalledTimes(1);
      expect(onChangeValue).toHaveBeenCalledWith('1.5');
    });

    it('passes dot decimals through unchanged', () => {
      const { input, onChangeValue } = renderRangeInput();

      fireEvent.changeText(input, '2.25');

      expect(onChangeValue).toHaveBeenCalledWith('2.25');
    });

    it('shows a "must be a number" error and skips the callback for non-numeric input', () => {
      const { input, onChangeValue } = renderRangeInput();

      fireEvent.changeText(input, 'abc');

      expect(onChangeValue).not.toHaveBeenCalled();
      expect(screen.getByText(`${NAME} must be a number`)).toBeOnTheScreen();
    });

    it('clears the error on the next valid input', () => {
      const { input, onChangeValue } = renderRangeInput();

      fireEvent.changeText(input, 'abc');
      fireEvent.changeText(input, '3');

      expect(onChangeValue).toHaveBeenCalledWith('3');
      expect(screen.queryByText(`${NAME} must be a number`)).toBeNull();
    });

    it('forwards an empty string so the field can be cleared', () => {
      const { input, onChangeValue } = renderRangeInput();

      fireEvent.changeText(input, '');

      expect(onChangeValue).toHaveBeenCalledWith('');
      expect(screen.queryByText(`${NAME} must be a number`)).toBeNull();
    });
  });

  describe('increment / decrement buttons', () => {
    it('increases the value by the default increment of 1', () => {
      const { plusButton, onChangeValue } = renderRangeInput();

      fireEvent.press(plusButton);

      expect(onChangeValue).toHaveBeenCalledWith('6');
    });

    it('decreases the value by the default increment of 1', () => {
      const { minusButton, onChangeValue } = renderRangeInput();

      fireEvent.press(minusButton);

      expect(onChangeValue).toHaveBeenCalledWith('4');
    });

    it('uses a custom increment without floating point drift', () => {
      const { plusButton, minusButton, onChangeValue } = renderRangeInput({
        value: '0.3',
        min: new BigNumber(0),
        increment: new BigNumber('0.1'),
      });

      fireEvent.press(plusButton);
      fireEvent.press(minusButton);

      expect(onChangeValue).toHaveBeenNthCalledWith(1, '0.4');
      expect(onChangeValue).toHaveBeenNthCalledWith(2, '0.2');
    });

    it('allows increasing up to exactly max', () => {
      const { plusButton, onChangeValue } = renderRangeInput({ value: '9' });

      fireEvent.press(plusButton);

      expect(onChangeValue).toHaveBeenCalledWith('10');
    });

    it('does not increase past max', () => {
      const { plusButton, onChangeValue } = renderRangeInput({ value: '10' });

      fireEvent.press(plusButton);

      expect(onChangeValue).not.toHaveBeenCalled();
    });

    it('allows decreasing down to exactly min', () => {
      const { minusButton, onChangeValue } = renderRangeInput({ value: '2' });

      fireEvent.press(minusButton);

      expect(onChangeValue).toHaveBeenCalledWith('1');
    });

    it('does not decrease below min', () => {
      const { minusButton, onChangeValue } = renderRangeInput({ value: '1' });

      fireEvent.press(minusButton);

      expect(onChangeValue).not.toHaveBeenCalled();
    });

    it('does not decrease below min when the increment would overshoot it', () => {
      const { minusButton, onChangeValue } = renderRangeInput({
        value: '1.5',
        increment: new BigNumber(1),
      });

      fireEvent.press(minusButton);

      expect(onChangeValue).not.toHaveBeenCalled();
    });

    it('is unbounded when max is not provided', () => {
      const { plusButton, onChangeValue } = renderRangeInput({
        value: '1000',
        max: undefined,
      });

      fireEvent.press(plusButton);

      expect(onChangeValue).toHaveBeenCalledWith('1001');
    });
  });

  describe('limit clamping', () => {
    it('clamps a value below min to min on mount and keeps the error visible', () => {
      const { onChangeValue } = renderRangeInput({ value: '0.5' });

      expect(onChangeValue).toHaveBeenCalledWith('1');
      expect(screen.getByText(`${NAME} must be at least 1`)).toBeOnTheScreen();
    });

    it('treats an empty value as 0 and clamps it to min', () => {
      const { onChangeValue } = renderRangeInput({ value: '' });

      expect(onChangeValue).toHaveBeenCalledWith('1');
      expect(screen.getByText(`${NAME} must be at least 1`)).toBeOnTheScreen();
    });

    it('clamps a value above max to max on mount', () => {
      const { onChangeValue } = renderRangeInput({ value: '11' });

      expect(onChangeValue).toHaveBeenCalledWith('10');
      // Unlike the min branch, the max branch calls changeValue without
      // dontEmptyError, so the "at most" message is cleared immediately.
      expect(screen.queryByText(`${NAME} must be at most 10`)).toBeNull();
    });

    it('re-clamps when the parent passes an out-of-range value', () => {
      const { onChangeValue, rerender } = renderRangeInput();
      expect(onChangeValue).not.toHaveBeenCalled();

      rerender(
        <RangeInput
          name={NAME}
          value="0"
          min={new BigNumber(1)}
          max={new BigNumber(10)}
          onChangeValue={onChangeValue}
        />,
      );

      expect(onChangeValue).toHaveBeenCalledWith('1');
      expect(screen.getByText(`${NAME} must be at least 1`)).toBeOnTheScreen();
    });

    describe('while the input is focused', () => {
      const focused = {
        createNodeMock: () => ({ isFocused: () => true, focus: jest.fn() }),
      };

      it('defers clamping until blur', () => {
        const { input, onChangeValue } = renderRangeInput(
          { value: '0' },
          focused,
        );

        expect(onChangeValue).not.toHaveBeenCalled();

        fireEvent(input, 'blur');

        expect(onChangeValue).toHaveBeenCalledWith('1');
        expect(
          screen.getByText(`${NAME} must be at least 1`),
        ).toBeOnTheScreen();
      });

      it('clamps to max on blur', () => {
        const { input, onChangeValue } = renderRangeInput(
          { value: '20' },
          focused,
        );

        expect(onChangeValue).not.toHaveBeenCalled();

        fireEvent(input, 'blur');

        expect(onChangeValue).toHaveBeenCalledWith('10');
      });

      it('does nothing on blur when the value is within limits', () => {
        const { input, onChangeValue } = renderRangeInput(
          { value: '5' },
          focused,
        );

        fireEvent(input, 'blur');

        expect(onChangeValue).not.toHaveBeenCalled();
      });
    });
  });

  describe('error prop', () => {
    it('renders the error prop', () => {
      renderRangeInput({ error: 'Max fee too low' });

      expect(screen.getByText('Max fee too low')).toBeOnTheScreen();
    });

    it('takes precedence over the internal validation error', () => {
      const { input } = renderRangeInput({ error: 'Max fee too low' });

      fireEvent.changeText(input, 'abc');

      expect(screen.getByText('Max fee too low')).toBeOnTheScreen();
      expect(screen.queryByText(`${NAME} must be a number`)).toBeNull();
    });
  });

  it('renders string labels, unit and inside label', () => {
    renderRangeInput({
      leftLabelComponent: 'Gas limit',
      rightLabelComponent: 'Estimate',
      unit: 'GWEI',
      inputInsideLabel: '$0.12',
    });

    expect(screen.getByText('Gas limit')).toBeOnTheScreen();
    expect(screen.getByText('Estimate')).toBeOnTheScreen();
    expect(screen.getByText('GWEI')).toBeOnTheScreen();
    expect(screen.getByText('$0.12')).toBeOnTheScreen();
  });
});
