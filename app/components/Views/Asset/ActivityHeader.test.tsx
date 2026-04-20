import React from 'react';
import { render } from '@testing-library/react-native';
import ActivityHeader from './ActivityHeader';
import { Asset } from '../../UI/AssetOverview/AssetOverview.types';

const baseAsset: Asset = {
  isETH: false,
  decimals: 18,
  name: 'DAI',
  symbol: 'DAI',
  hasBalanceError: false,
  address: '0xabc',
};

describe('ActivityHeader', () => {
  it('renders the activity heading using asset.name and matches snapshot', () => {
    const { toJSON, getByText } = render(<ActivityHeader asset={baseAsset} />);

    expect(getByText(/DAI/)).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('falls back to asset.symbol when asset.name is empty', () => {
    const { getByText } = render(
      <ActivityHeader asset={{ ...baseAsset, name: '', symbol: 'USDC' }} />,
    );

    expect(getByText(/USDC/)).toBeDefined();
  });
});
