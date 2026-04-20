import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('../../StyledButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ onPress, children }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

// eslint-disable-next-line import/first
import ApplePayButton from './ApplePayButton';

describe('ApplePayButton', () => {
  it('renders the provided label', () => {
    const { toJSON, getByText } = renderWithProvider(
      <ApplePayButton label="Pay" onPress={jest.fn()} />,
    );
    expect(getByText('Pay')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProvider(
      <ApplePayButton label="Pay" onPress={onPress} />,
    );
    fireEvent.press(getByText('Pay'));
    expect(onPress).toHaveBeenCalled();
  });
});
