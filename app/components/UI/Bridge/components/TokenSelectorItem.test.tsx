import React from 'react';
import { Text } from 'react-native';
import { ethers } from 'ethers';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react-native';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { TokenSelectorItem } from './TokenSelectorItem';
import { BridgeToken } from '../types';
import {
  TOKEN_BALANCE_LOADING,
  TOKEN_BALANCE_LOADING_UPPERCASE,
} from '../../Tokens/constants';

jest.mock('../../../hooks/useIpfsGateway', () => jest.fn(() => 'https://dweb.link/ipfs/'));

const mockStore = configureMockStore();
const mockState = {
  settings: {},
  engine: { backgroundState },
};
const store = mockStore(mockState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn().mockImplementation((cb) => cb(mockState)),
}));

const nativeToken: BridgeToken = {
  address: ethers.constants.AddressZero,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  chainId: '0x1',
  image: 'https://example.com/eth.png',
  balance: '1.5',
  balanceFiat: '$3,000',
};

const erc20Token: BridgeToken = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chainId: '0x1',
  image: 'https://example.com/usdc.png',
  balance: '100',
  balanceFiat: '$100',
};

type ItemProps = React.ComponentProps<typeof TokenSelectorItem>;
const renderItem = (props: Partial<ItemProps> & Pick<ItemProps, 'token'>) =>
  render(
    <Provider store={store}>
      <TokenSelectorItem
        onPress={jest.fn()}
        networkName="Ethereum"
        {...props}
      />
    </Provider>,
  );

describe('TokenSelectorItem', () => {
  it('matches snapshot for a native token', () => {
    const { toJSON } = renderItem({ token: nativeToken });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders symbol, name, and balances', () => {
    const { getByText } = renderItem({ token: erc20Token });
    expect(getByText('USDC')).toBeTruthy();
    expect(getByText('USD Coin')).toBeTruthy();
    expect(getByText('100 USDC')).toBeTruthy();
    expect(getByText('$100')).toBeTruthy();
  });

  it('calls onPress with the token when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderItem({ token: erc20Token, onPress });
    fireEvent.press(getByText('USDC'));
    expect(onPress).toHaveBeenCalledWith(erc20Token);
  });

  it('hides balance and secondary balance when shouldShowBalance is false', () => {
    const { queryByText } = renderItem({
      token: erc20Token,
      shouldShowBalance: false,
    });
    expect(queryByText('$100')).toBeNull();
    expect(queryByText('100 USDC')).toBeNull();
  });

  it('shows a skeleton placeholder when balance is loading', () => {
    const loadingToken: BridgeToken = {
      ...erc20Token,
      balance: TOKEN_BALANCE_LOADING,
      balanceFiat: TOKEN_BALANCE_LOADING_UPPERCASE,
    };
    const { queryByText } = renderItem({ token: loadingToken });
    expect(queryByText(TOKEN_BALANCE_LOADING)).toBeNull();
    expect(queryByText(TOKEN_BALANCE_LOADING_UPPERCASE)).toBeNull();
  });

  it('renders the selected indicator when isSelected is true', () => {
    const { toJSON } = renderItem({ token: erc20Token, isSelected: true });
    expect(toJSON()).toBeTruthy();
  });

  it('renders children as trailing content', () => {
    const { getByText } = renderItem({
      token: erc20Token,
      children: <Text>trailing</Text>,
    });
    expect(getByText('trailing')).toBeTruthy();
  });

  it('omits balance symbol text when token has no balance at all', () => {
    const bareToken: BridgeToken = {
      ...nativeToken,
      balance: undefined,
      balanceFiat: undefined,
    };
    const { queryByText } = renderItem({ token: bareToken });
    expect(queryByText(/^\d.* ETH$/)).toBeNull();
  });
});
