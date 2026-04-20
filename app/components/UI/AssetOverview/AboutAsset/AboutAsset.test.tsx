import React from 'react';
import { render } from '@testing-library/react-native';
import AboutAsset from './AboutAsset';
import { Asset } from '../AssetOverview.types';
import useTokenDescriptions, {
  TokenDescriptions,
} from '../../../hooks/useTokenDescriptions';

jest.mock('../../../hooks/useTokenDescriptions');

const makeDescriptions = (en: string) =>
  ({ en } as unknown as TokenDescriptions);

const asset: Asset = {
  isETH: false,
  decimals: 18,
  name: 'DAI',
  symbol: 'DAI',
  hasBalanceError: false,
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
};

describe('AboutAsset', () => {
  const mockedHook = useTokenDescriptions as jest.MockedFunction<
    typeof useTokenDescriptions
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when there is no description and loading is finished', () => {
    mockedHook.mockReturnValue({ data: {}, isLoading: false, error: null });

    const { toJSON } = render(<AboutAsset asset={asset} chainId="0x1" />);

    expect(toJSON()).toBeNull();
  });

  it('renders a skeleton while the description is loading', () => {
    mockedHook.mockReturnValue({ data: {}, isLoading: true, error: null });

    const { getByText } = render(<AboutAsset asset={asset} chainId="0x1" />);

    expect(getByText(/about/i)).toBeDefined();
  });

  it('renders the english description when loading is complete', () => {
    mockedHook.mockReturnValue({
      data: makeDescriptions('A stablecoin pegged to USD.'),
      isLoading: false,
      error: null,
    });

    const { getByText, toJSON } = render(
      <AboutAsset asset={asset} chainId="0x1" />,
    );

    expect(getByText('A stablecoin pegged to USD.')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('looks up the description by the token address when the asset is not ETH', () => {
    mockedHook.mockReturnValue({
      data: makeDescriptions('desc'),
      isLoading: false,
      error: null,
    });

    render(<AboutAsset asset={asset} chainId="0x1" />);

    expect(mockedHook).toHaveBeenCalledWith({
      address: asset.address,
      chainId: '0x1',
    });
  });

  it('uses the zero address when the asset is ETH', () => {
    mockedHook.mockReturnValue({
      data: makeDescriptions('desc'),
      isLoading: false,
      error: null,
    });

    render(
      <AboutAsset asset={{ ...asset, isETH: true }} chainId="0x1" />,
    );

    const [[arg]] = mockedHook.mock.calls;
    expect(arg.address.toLowerCase()).toMatch(/^0x0+$/);
  });
});
