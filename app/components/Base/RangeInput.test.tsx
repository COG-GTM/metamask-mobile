// Third party dependencies.
import React from 'react';
import BigNumber from 'bignumber.js';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import RangeInput from './RangeInput';

describe('RangeInput', () => {
  it('renders label components, a value and an error message', () => {
    const { getByDisplayValue, getByText, toJSON } = render(
      <RangeInput
        leftLabelComponent="Left"
        rightLabelComponent="Right"
        value="5"
        unit="gwei"
        error="Bad value"
        min={new BigNumber(1)}
        max={new BigNumber(10)}
        name="Gas"
        onChangeValue={jest.fn()}
      />,
    );
    expect(getByText('Left')).toBeTruthy();
    expect(getByText('Right')).toBeTruthy();
    expect(getByText('gwei')).toBeTruthy();
    expect(getByText('Bad value')).toBeTruthy();
    expect(getByDisplayValue('5')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('calls onChangeValue when the text input changes', () => {
    const onChangeValue = jest.fn();
    const { getByDisplayValue } = render(
      <RangeInput
        value="5"
        unit="gwei"
        min={new BigNumber(1)}
        max={new BigNumber(10)}
        name="Gas"
        onChangeValue={onChangeValue}
      />,
    );
    fireEvent.changeText(getByDisplayValue('5'), '7');
    expect(onChangeValue).toHaveBeenCalledWith('7');
  });

  it('clamps value below min on blur', () => {
    const onChangeValue = jest.fn();
    const { getByDisplayValue } = render(
      <RangeInput
        value="0"
        min={new BigNumber(1)}
        max={new BigNumber(10)}
        name="Gas"
        onChangeValue={onChangeValue}
      />,
    );
    fireEvent(getByDisplayValue('0'), 'blur');
    expect(onChangeValue).toHaveBeenCalledWith('1', undefined);
  });
});
