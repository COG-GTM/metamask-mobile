import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SnapUICheckbox } from './SnapUICheckbox';
import { useSnapInterfaceContext } from '../SnapInterfaceContext';

jest.mock('../SnapInterfaceContext');

describe('SnapUICheckbox', () => {
  const handleInputChange = jest.fn();
  const getValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSnapInterfaceContext as jest.Mock).mockReturnValue({
      handleInputChange,
      getValue,
    });
    getValue.mockReturnValue(false);
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SnapUICheckbox name="agree" label="I agree" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders a field label when provided', () => {
    const { getByText } = render(
      <SnapUICheckbox name="agree" fieldLabel="Consent" label="I agree" />,
    );
    expect(getByText('Consent')).toBeTruthy();
  });

  it('calls handleInputChange when the checkbox is pressed', () => {
    const { getByText } = render(
      <SnapUICheckbox name="agree" label="I agree" form="signup" />,
    );
    fireEvent.press(getByText('I agree'));
    expect(handleInputChange).toHaveBeenCalledWith('agree', true, 'signup');
  });

  it('displays an error message when error is set', () => {
    const { getByText } = render(
      <SnapUICheckbox name="agree" label="I agree" error="Required" />,
    );
    expect(getByText('Required')).toBeTruthy();
  });

  it('uses the initial value from the snap interface context', () => {
    getValue.mockReturnValue(true);
    const { toJSON } = render(
      <SnapUICheckbox name="agree" label="I agree" />,
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('I agree');
  });
});
