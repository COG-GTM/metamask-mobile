import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SnapUIInput } from './SnapUIInput';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';
import { INPUT_TEST_ID } from '../../../component-library/components/Form/TextField/foundation/Input/Input.constants';

jest.mock('../SnapInterfaceContext');

describe('SnapUIInput', () => {
  const handleInputChange = jest.fn();
  const setCurrentFocusedInput = jest.fn();
  const getValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSnapInterfaceContext as jest.Mock).mockReturnValue({
      handleInputChange,
      setCurrentFocusedInput,
      getValue,
      focusedInput: null,
    });
    getValue.mockReturnValue('');
  });

  it('renders a TextField', () => {
    const { getByTestId } = render(<SnapUIInput name="username" />);
    expect(getByTestId(INPUT_TEST_ID)).toBeTruthy();
  });

  it('shows a label when provided', () => {
    const { getByText } = render(
      <SnapUIInput name="username" label="Username" />,
    );
    expect(getByText('Username')).toBeTruthy();
  });

  it('shows the error help text when error is provided', () => {
    const { getByText } = render(
      <SnapUIInput name="username" error="Required" />,
    );
    expect(getByText('Required')).toBeTruthy();
  });

  it('calls handleInputChange when text changes', () => {
    const { getByTestId } = render(<SnapUIInput name="username" form="f" />);
    fireEvent.changeText(getByTestId(INPUT_TEST_ID), 'hello');
    expect(handleInputChange).toHaveBeenCalledWith('username', 'hello', 'f');
  });

  it('tracks the focused input on focus and clears it on blur', () => {
    const { getByTestId } = render(<SnapUIInput name="username" />);
    const input = getByTestId(INPUT_TEST_ID);
    fireEvent(input, 'focus');
    expect(setCurrentFocusedInput).toHaveBeenCalledWith('username');
    fireEvent(input, 'blur');
    expect(setCurrentFocusedInput).toHaveBeenCalledWith(null);
  });

  it('shows the disabled state when disabled', () => {
    const { getByTestId } = render(
      <SnapUIInput name="username" disabled />,
    );
    expect(getByTestId(INPUT_TEST_ID).props.editable).toBe(false);
  });
});
