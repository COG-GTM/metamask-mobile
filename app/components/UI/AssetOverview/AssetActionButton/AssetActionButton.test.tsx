import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AssetActionButton from './AssetActionButton';

describe('AssetActionButton', () => {
  it('renders the label and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <AssetActionButton label="Send" icon="send" onPress={jest.fn()} />,
    );

    expect(getByText('Send')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('truncates labels longer than 10 characters', () => {
    const { getByText } = render(
      <AssetActionButton label="Very Long Button Label" icon="send" />,
    );

    expect(getByText('Very Lo...')).toBeDefined();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AssetActionButton label="Swap" icon="swap" onPress={onPress} />,
    );

    fireEvent.press(getByText('Swap'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('still renders the label when the button is marked as disabled', () => {
    const { getByText } = render(
      <AssetActionButton
        label="Buy"
        icon="buy"
        onPress={jest.fn()}
        disabled
      />,
    );

    expect(getByText('Buy')).toBeDefined();
  });

  it.each(['send', 'receive', 'add', 'information', 'swap', 'buy', 'unknown'])(
    'renders without error for icon type "%s"',
    (iconType) => {
      const { getByText } = render(
        <AssetActionButton label="Label" icon={iconType} />,
      );

      expect(getByText('Label')).toBeDefined();
    },
  );
});
