import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import TokenListControlBar from './TokenListControlBar';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { WalletViewSelectorsIDs } from '../../../../../e2e/selectors/wallet/WalletView.selectors';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../../../selectors/networkController', () => ({
  ...jest.requireActual('../../../../selectors/networkController'),
  selectChainId: jest.fn(() => '0x1'),
  selectIsPopularNetwork: jest.fn(() => true),
  selectIsAllNetworks: jest.fn(() => true),
}));

jest.mock('../../../../selectors/multichainNetworkController', () => ({
  ...jest.requireActual('../../../../selectors/multichainNetworkController'),
  selectIsEvmNetworkSelected: jest.fn(() => true),
}));

jest.mock('../../../../selectors/networkInfos', () => ({
  ...jest.requireActual('../../../../selectors/networkInfos'),
  selectNetworkName: jest.fn(() => 'Ethereum Mainnet'),
}));

const state = { engine: { backgroundState } };

describe('TokenListControlBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the control bar and matches snapshot', () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <TokenListControlBar goToAddToken={jest.fn()} />,
      { state },
    );

    expect(
      getByTestId(WalletViewSelectorsIDs.TOKEN_NETWORK_FILTER),
    ).toBeDefined();
    expect(getByTestId(WalletViewSelectorsIDs.SORT_BY)).toBeDefined();
    expect(
      getByTestId(WalletViewSelectorsIDs.IMPORT_TOKEN_BUTTON),
    ).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the sort bottom sheet when the sort button is pressed', () => {
    const { getByTestId } = renderWithProvider(
      <TokenListControlBar goToAddToken={jest.fn()} />,
      { state },
    );

    fireEvent.press(getByTestId(WalletViewSelectorsIDs.SORT_BY));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('invokes goToAddToken when the add button is pressed', () => {
    const goToAddToken = jest.fn();
    const { getByTestId } = renderWithProvider(
      <TokenListControlBar goToAddToken={goToAddToken} />,
      { state },
    );

    fireEvent.press(getByTestId(WalletViewSelectorsIDs.IMPORT_TOKEN_BUTTON));

    expect(goToAddToken).toHaveBeenCalledTimes(1);
  });

  it('navigates to the filter bottom sheet when the network filter button is pressed on an EVM network', () => {
    const { getByTestId } = renderWithProvider(
      <TokenListControlBar goToAddToken={jest.fn()} />,
      { state },
    );

    fireEvent.press(getByTestId(WalletViewSelectorsIDs.TOKEN_NETWORK_FILTER));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
