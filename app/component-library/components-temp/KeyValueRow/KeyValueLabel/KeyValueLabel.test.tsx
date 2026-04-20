// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import KeyValueRowLabel from './KeyValueLabel';

const openTooltipModal = jest.fn();

jest.mock('../../../../components/hooks/useTooltipModal', () => ({
  __esModule: true,
  default: () => ({ openTooltipModal }),
}));

describe('KeyValueRowLabel', () => {
  beforeEach(() => {
    openTooltipModal.mockClear();
  });

  it('renders a predefined label text', () => {
    const { getByText } = render(
      <KeyValueRowLabel label={{ text: 'Amount' }} />,
    );
    expect(getByText('Amount')).toBeTruthy();
  });

  it('renders a ReactNode label', () => {
    const { getByText } = render(
      <KeyValueRowLabel label={<RNText>custom</RNText>} />,
    );
    expect(getByText('custom')).toBeTruthy();
  });

  it('opens the tooltip modal on press when tooltip is provided', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <KeyValueRowLabel
        label={{ text: 'With tooltip' }}
        tooltip={{
          title: 'Tip',
          content: 'Body',
          onPress,
        }}
      />,
    );
    fireEvent.press(getByRole('button'));
    expect(openTooltipModal).toHaveBeenCalledWith('Tip', 'Body');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render a tooltip button when tooltip is missing title or content', () => {
    const { queryByRole } = render(
      <KeyValueRowLabel label={{ text: 'No tooltip' }} />,
    );
    expect(queryByRole('button')).toBeNull();
  });
});
