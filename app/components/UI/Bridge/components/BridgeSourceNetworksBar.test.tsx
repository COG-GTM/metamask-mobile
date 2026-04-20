import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import {
  BridgeSourceNetworksBar,
  MAX_NETWORK_ICONS,
} from './BridgeSourceNetworksBar';
import Routes from '../../../../constants/navigation/Routes';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const ethChainId = '0x1';
const optimismChainId = '0xa';
const polygonChainId = '0x89';
const baseChainId = '0x2105';

const networkConfigurations = {
  [ethChainId]: { name: 'Ethereum' },
  [optimismChainId]: { name: 'Optimism' },
  [polygonChainId]: { name: 'Polygon' },
  [baseChainId]: { name: 'Base' },
} as unknown as React.ComponentProps<typeof BridgeSourceNetworksBar>['networkConfigurations'];

const enabledSourceChains = [
  { chainId: ethChainId },
  { chainId: optimismChainId },
  { chainId: polygonChainId },
  { chainId: baseChainId },
] as unknown as React.ComponentProps<typeof BridgeSourceNetworksBar>['enabledSourceChains'];

describe('BridgeSourceNetworksBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('exports MAX_NETWORK_ICONS as 3', () => {
    expect(MAX_NETWORK_ICONS).toBe(3);
  });

  it('matches snapshot for the "all networks" case', () => {
    const { toJSON } = renderWithProvider(
      <BridgeSourceNetworksBar
        networksToShow={[{ chainId: ethChainId }, { chainId: optimismChainId }]}
        networkConfigurations={networkConfigurations}
        selectedSourceChainIds={[ethChainId, optimismChainId, polygonChainId, baseChainId]}
        enabledSourceChains={enabledSourceChains}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows overflow "+N" indicator when more than MAX_NETWORK_ICONS are selected', () => {
    const { getByText } = renderWithProvider(
      <BridgeSourceNetworksBar
        networksToShow={[
          { chainId: ethChainId },
          { chainId: optimismChainId },
          { chainId: polygonChainId },
        ]}
        networkConfigurations={networkConfigurations}
        selectedSourceChainIds={[ethChainId, optimismChainId, polygonChainId, baseChainId]}
        enabledSourceChains={enabledSourceChains}
      />,
    );
    expect(getByText('+1')).toBeTruthy();
  });

  it('does not show overflow indicator when at or below MAX_NETWORK_ICONS', () => {
    const { queryByText } = renderWithProvider(
      <BridgeSourceNetworksBar
        networksToShow={[{ chainId: ethChainId }]}
        networkConfigurations={networkConfigurations}
        selectedSourceChainIds={[ethChainId]}
        enabledSourceChains={enabledSourceChains}
      />,
    );
    expect(queryByText('+1')).toBeNull();
  });

  it('navigates to the source network selector when tapped', () => {
    const { getAllByRole } = renderWithProvider(
      <BridgeSourceNetworksBar
        networksToShow={[{ chainId: ethChainId }]}
        networkConfigurations={networkConfigurations}
        selectedSourceChainIds={[ethChainId]}
        enabledSourceChains={enabledSourceChains}
      />,
    );
    const buttons = getAllByRole('button');
    fireEvent.press(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(Routes.BRIDGE.MODALS.ROOT, {
      screen: Routes.BRIDGE.MODALS.SOURCE_NETWORK_SELECTOR,
    });
  });
});
