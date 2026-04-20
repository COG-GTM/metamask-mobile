import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import Box from './Box';

describe('Box', () => {
  it('renders children without label or press handler', () => {
    const { toJSON, getByText, queryByRole } = render(
      <Box>
        <Text>box-child</Text>
      </Box>,
    );
    expect(getByText('box-child')).toBeDefined();
    expect(queryByRole('button')).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a label when provided', () => {
    const { getByText } = render(
      <Box label="Amount">
        <Text>box-child</Text>
      </Box>,
    );
    expect(getByText('Amount')).toBeDefined();
  });

  it('calls onPress and exposes a button role when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Box onPress={onPress} highlighted thin compact>
        <Text>pressable</Text>
      </Box>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
