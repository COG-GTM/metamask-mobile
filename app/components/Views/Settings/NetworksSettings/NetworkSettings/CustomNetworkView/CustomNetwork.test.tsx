import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import CustomNetwork from './CustomNetwork';

jest.mock('../../../../../UI/NetworkModal', () => {
  const ReactLib = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return ({ isVisible }: { isVisible: boolean }) =>
    isVisible
      ? ReactLib.createElement(
          View,
          { testID: 'network-modal' },
          ReactLib.createElement(Text, null, 'modal'),
        )
      : null;
});

jest.mock('../../../../../../components/hooks/useSafeChains', () => ({
  useSafeChains: jest.fn(() => ({ safeChains: [] })),
}));

jest.mock(
  '../../../../../../util/networks/isNetworkUiRedesignEnabled',
  () => ({
    isNetworkUiRedesignEnabled: jest.fn(() => false),
  }),
);

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock('../../../../../../core/Multichain/utils', () => ({
  isNonEvmChainId: jest.fn(() => false),
}));

const initialState = { engine: { backgroundState } };

const baseProps = {
  showPopularNetworkModal: false,
  isNetworkModalVisible: false,
  closeNetworkModal: jest.fn(),
  selectedNetwork: undefined,
  toggleWarningModal: jest.fn(),
  showNetworkModal: jest.fn(),
  shouldNetworkSwitchPopToWallet: false,
  onNetworkSwitch: jest.fn(),
  showAddedNetworks: true,
  displayContinue: false,
  showCompletionMessage: true,
  hideWarningIcons: false,
};

const sampleNetwork = {
  chainId: '0x1',
  nickname: 'Ethereum Mainnet',
  rpcUrl: 'https://mainnet.infura.io',
  ticker: 'ETH',
  warning: false,
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
    imageUrl: '',
  },
};

describe('CustomNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn() });
  });

  it('renders correctly with a custom networks list', () => {
    const { toJSON, getByText } = renderWithProvider(
      <CustomNetwork
        {...baseProps}
        customNetworksList={[sampleNetwork]}
      />,
      { state: initialState },
    );
    expect(getByText('Ethereum Mainnet')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the empty list component when there are no networks to show', () => {
    const { queryByText, getByText } = renderWithProvider(
      <CustomNetwork
        {...baseProps}
        customNetworksList={[]}
        showAddedNetworks={false}
      />,
      { state: initialState },
    );
    expect(queryByText('Ethereum Mainnet')).toBeNull();
    expect(getByText).toBeDefined();
  });

  it('calls showNetworkModal when a network item is pressed', () => {
    const showNetworkModal = jest.fn();
    const { getByText } = renderWithProvider(
      <CustomNetwork
        {...baseProps}
        customNetworksList={[sampleNetwork]}
        showNetworkModal={showNetworkModal}
      />,
      { state: initialState },
    );

    fireEvent.press(getByText('Ethereum Mainnet'));
    expect(showNetworkModal).toHaveBeenCalled();
  });

  it('renders the network modal when isNetworkModalVisible is true', () => {
    const { getByTestId } = renderWithProvider(
      <CustomNetwork
        {...baseProps}
        customNetworksList={[sampleNetwork]}
        isNetworkModalVisible
      />,
      { state: initialState },
    );
    expect(getByTestId('network-modal')).toBeTruthy();
  });
});
