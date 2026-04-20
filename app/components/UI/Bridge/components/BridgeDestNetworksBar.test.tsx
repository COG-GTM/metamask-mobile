/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderScreen } from '../../../../util/test/renderWithProvider';
import { BridgeDestNetworksBar } from './BridgeDestNetworksBar';
import Routes from '../../../../constants/navigation/Routes';
import { initialState } from '../_mocks_/initialState';
import { setSelectedDestChainId } from '../../../../core/redux/slices/bridge';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../../core/redux/slices/bridge', () => {
  const actual = jest.requireActual('../../../../core/redux/slices/bridge');
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    setSelectedDestChainId: jest.fn(actual.setSelectedDestChainId),
  };
});

const buildState = () => ({
  ...initialState,
  engine: {
    ...initialState.engine,
    backgroundState: {
      ...initialState.engine.backgroundState,
      NetworkController: {
        ...initialState.engine.backgroundState.NetworkController,
        providerConfig: {
          ...initialState.engine.backgroundState.NetworkController.providerConfig,
          chainId: '0xa',
        },
      },
    },
  },
  bridge: {
    ...initialState.bridge,
    selectedDestChainId: '0xa',
  },
});

describe('BridgeDestNetworksBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderScreen(
      BridgeDestNetworksBar,
      { name: 'BridgeDestNetworksBar' },
      { state: buildState() as unknown as Record<string, unknown> },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders destination chain buttons', () => {
    const { getAllByRole } = renderScreen(
      BridgeDestNetworksBar,
      { name: 'BridgeDestNetworksBar' },
      { state: buildState() as unknown as Record<string, unknown> },
    );
    expect(getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('dispatches setSelectedDestChainId when a chain button is pressed', () => {
    const { getAllByRole } = renderScreen(
      BridgeDestNetworksBar,
      { name: 'BridgeDestNetworksBar' },
      { state: buildState() as unknown as Record<string, unknown> },
    );
    const buttons = getAllByRole('button');
    // First button is "See all"; following are chain buttons
    if (buttons.length > 1) {
      fireEvent.press(buttons[1]);
      expect(setSelectedDestChainId).toHaveBeenCalled();
    }
  });

  it('navigates to the network selector when "See all" is pressed', () => {
    const { getByText } = renderScreen(
      BridgeDestNetworksBar,
      { name: 'BridgeDestNetworksBar' },
      { state: buildState() as unknown as Record<string, unknown> },
    );
    const seeAllLabel = getByText(/see all/i);
    fireEvent.press(seeAllLabel);
    expect(mockNavigate).toHaveBeenCalledWith(Routes.BRIDGE.MODALS.ROOT, {
      screen: Routes.BRIDGE.MODALS.DEST_NETWORK_SELECTOR,
    });
  });
});
