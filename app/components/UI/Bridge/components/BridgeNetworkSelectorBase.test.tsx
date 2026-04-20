import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { BridgeNetworkSelectorBase } from './BridgeNetworkSelectorBase';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

const wrap = (ui: React.ReactElement) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    {ui}
  </SafeAreaProvider>
);

describe('BridgeNetworkSelectorBase', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('matches snapshot with children', () => {
    const { toJSON } = renderWithProvider(
      wrap(
        <BridgeNetworkSelectorBase>
          <Text>child-content</Text>
        </BridgeNetworkSelectorBase>,
      ),
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders children inside the sheet', () => {
    const { getByText } = renderWithProvider(
      wrap(
        <BridgeNetworkSelectorBase>
          <Text>child-content</Text>
        </BridgeNetworkSelectorBase>,
      ),
    );
    expect(getByText('child-content')).toBeTruthy();
  });

  it('calls navigation.goBack when the close button is pressed', () => {
    const { getByTestId } = renderWithProvider(
      wrap(
        <BridgeNetworkSelectorBase>
          <Text>child</Text>
        </BridgeNetworkSelectorBase>,
      ),
    );
    fireEvent.press(getByTestId('bridge-network-selector-close-button'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
