import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';
import AssetSelectorButton from './AssetSelectorButton';

describe('AssetSelectorButton', () => {
  it('renders asset name, symbol and the provided icon', () => {
    const { toJSON, getByText, getByTestId } = render(
      <AssetSelectorButton
        label="Token"
        assetName="Ethereum"
        assetSymbol="ETH"
        icon={<View testID="icon" />}
      />,
    );
    expect(getByText('Ethereum')).toBeDefined();
    expect(getByText('ETH')).toBeDefined();
    expect(getByTestId('icon')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <AssetSelectorButton
        assetName="Bitcoin"
        assetSymbol="BTC"
        onPress={onPress}
      />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
