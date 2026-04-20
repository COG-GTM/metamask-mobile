import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import configureMockStore from 'redux-mock-store';
import { Provider, useSelector } from 'react-redux';
import Balance, { NetworkBadgeSource } from './Balance';
import { selectChainId } from '../../../../selectors/networkController';
import { selectNetworkName } from '../../../../selectors/networkInfos';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { MOCK_VAULT_APY_AVERAGES } from '../../Stake/components/PoolStakingLearnMoreModal/mockVaultRewards';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../../../core/Engine', () => ({
  context: {
    NetworkController: {
      getNetworkClientById: () => ({
        configuration: {
          chainId: '0x1',
          rpcUrl: 'https://mainnet.infura.io/v3',
          ticker: 'ETH',
          type: 'custom',
        },
      }),
      findNetworkClientIdByChainId: () => 'mainnet',
    },
  },
}));

jest.mock('../../Stake/hooks/usePooledStakes', () => ({
  __esModule: true,
  default: () => ({
    pooledStakesData: {
      account: '0xabc',
      assets: '10000000000000000',
      exitRequests: [],
      lifetimeRewards: '100000000000000',
    },
    exchangeRate: 1.018,
    hasStakedPositions: true,
    hasEthToUnstake: true,
    isLoadingPooledStakesData: false,
  }),
}));

jest.mock('../../Stake/hooks/useVaultApyAverages', () => ({
  __esModule: true,
  default: () => ({
    vaultApyAverages: MOCK_VAULT_APY_AVERAGES,
    isLoadingVaultApyAverages: false,
    refreshVaultApyAverages: jest.fn(),
  }),
}));

jest.mock('../../Stake/hooks/useStakingEligibility', () => ({
  __esModule: true,
  default: () => ({ isEligible: true }),
}));

const mockDAI = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  aggregators: ['Metamask', 'Coinmarketcap'],
  hasBalanceError: false,
  balance: '6.49757',
  balanceFiat: '$6.49',
  decimals: 18,
  image:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
  name: 'Dai Stablecoin',
  symbol: 'DAI',
  isETH: false,
  logo: 'image-path',
  chainId: '0x1',
  isNative: false,
};

const mockETH = {
  address: '0x0000000000000000000000000000',
  aggregators: [],
  balanceError: null,
  balance: '100',
  balanceFiat: '$10000',
  decimals: 18,
  image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/eth.png',
  name: 'Ethereum',
  symbol: 'ETH',
  isETH: true,
  logo: 'image-path',
  chainId: '0x1',
  isNative: true,
};

const mockInitialState = { engine: { backgroundState } };

describe('Balance', () => {
  const mockStore = configureMockStore();
  const store = mockStore(mockInitialState);

  Image.getSize = jest.fn(
    (
      _uri: string,
      success?: (width: number, height: number) => void,
    ) => {
      if (success) success(100, 100);
      return Promise.resolve({ width: 100, height: 100 });
    },
  ) as unknown as typeof Image.getSize;

  beforeEach(() => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      switch (selector) {
        case selectNetworkName:
          return {};
        case selectChainId:
          return '1';
        default:
          return undefined;
      }
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('renders and matches snapshot for a token balance', () => {
    const { toJSON } = render(
      <Balance asset={mockDAI} mainBalance="123" secondaryBalance="456" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to AssetDetails when a non-native token row is pressed', () => {
    const { getByTestId } = render(
      <Balance asset={mockDAI} mainBalance="123" secondaryBalance="456" />,
    );

    fireEvent.press(getByTestId('asset-DAI'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('AssetDetails', {
      chainId: mockDAI.chainId,
      address: mockDAI.address,
    });
  });

  it('does not navigate for native tokens', () => {
    const { queryAllByTestId } = render(
      <Provider store={store}>
        <Balance asset={mockETH} mainBalance="100" secondaryBalance="200" />
      </Provider>,
    );

    queryAllByTestId('asset-ETH').forEach((el) => fireEvent.press(el));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('NetworkBadgeSource', () => {
  it('returns a testnet image for a testnet chainId', () => {
    expect(NetworkBadgeSource('0xaa36a7')).toBeDefined();
  });

  it('returns an Ethereum mainnet image for 0x1', () => {
    expect(NetworkBadgeSource('0x1')).toBeDefined();
  });

  it('returns a Linea mainnet image for 0xe708', () => {
    expect(NetworkBadgeSource('0xe708')).toBeDefined();
  });

  it('returns undefined for an unknown chainId', () => {
    expect(NetworkBadgeSource('0x999')).toBeUndefined();
  });
});
