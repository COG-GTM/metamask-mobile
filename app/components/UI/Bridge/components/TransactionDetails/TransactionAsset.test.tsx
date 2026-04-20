import React from 'react';
import { ethers } from 'ethers';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render } from '@testing-library/react-native';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import TransactionAsset from './TransactionAsset';
import { BridgeToken } from '../../types';

jest.mock('../../../../hooks/useIpfsGateway', () => jest.fn(() => 'https://dweb.link/ipfs/'));

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
};

const erc20Token: BridgeToken = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chainId: '0x1',
  image: 'https://example.com/usdc.png',
};

const renderAsset = (props: React.ComponentProps<typeof TransactionAsset>) =>
  render(
    <Provider store={store}>
      <TransactionAsset {...props} />
    </Provider>,
  );

describe('TransactionAsset', () => {
  it('matches snapshot for a native token', () => {
    const { toJSON } = renderAsset({
      token: nativeToken,
      tokenAmount: '1.5',
      chainId: nativeToken.chainId,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the token amount and symbol for a native token', () => {
    const { getByText } = renderAsset({
      token: nativeToken,
      tokenAmount: '1.5',
      chainId: nativeToken.chainId,
    });
    expect(getByText('1.5 ETH')).toBeTruthy();
  });

  it('renders ERC20 tokens with their amount and symbol', () => {
    const { getByText } = renderAsset({
      token: erc20Token,
      tokenAmount: '100',
      chainId: erc20Token.chainId,
    });
    expect(getByText('100 USDC')).toBeTruthy();
  });

  it('handles ERC20 tokens without an image field', () => {
    const { getByText } = renderAsset({
      token: { ...erc20Token, image: undefined },
      tokenAmount: '0.25',
      chainId: erc20Token.chainId,
    });
    expect(getByText('0.25 USDC')).toBeTruthy();
  });
});
