import React from 'react';
import { render } from '@testing-library/react-native';
import { SnapUIAssetSelector } from './SnapUIAssetSelector';
import { useSnapAssetSelectorData } from './useSnapAssetDisplay';
import type { CaipAccountId, CaipChainId } from '@metamask/utils';

jest.mock('./useSnapAssetDisplay', () => ({
  useSnapAssetSelectorData: jest.fn(),
}));

jest.mock('../SnapUISelector/SnapUISelector', () => ({
  SnapUISelector: jest.fn(() => null),
}));

// eslint-disable-next-line import/first, @typescript-eslint/no-unused-vars
import { SnapUISelector } from '../SnapUISelector/SnapUISelector';

describe('SnapUIAssetSelector', () => {
  const addresses: CaipAccountId[] = [
    'solana:5eykt4:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT',
  ];
  const chainIds: CaipChainId[] = ['solana:5eykt4'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the provided assets and builds matching options', () => {
    (useSnapAssetSelectorData as jest.Mock).mockReturnValue([
      {
        icon: 'i',
        symbol: 'SOL',
        name: 'Solana',
        balance: '1',
        fiat: '$1',
        chainId: 'solana:5eykt4',
        address: 'solana:5eykt4/token:abcd',
        networkName: 'Solana',
      },
    ]);

    render(
      <SnapUIAssetSelector
        name="asset"
        addresses={addresses}
        chainIds={chainIds}
      />,
    );

    const call = (SnapUISelector as unknown as jest.Mock).mock.calls[0][0];
    expect(call.options).toEqual([
      {
        key: 'asset',
        value: expect.objectContaining({
          asset: 'solana:5eykt4/token:abcd',
          name: 'Solana',
          symbol: 'SOL',
        }),
        disabled: false,
      },
    ]);
    expect(call.optionComponents).toHaveLength(1);
  });

  it('disables the selector when there are no assets', () => {
    (useSnapAssetSelectorData as jest.Mock).mockReturnValue([]);

    render(
      <SnapUIAssetSelector
        name="asset"
        addresses={addresses}
        chainIds={chainIds}
      />,
    );

    const call = (SnapUISelector as unknown as jest.Mock).mock.calls[0][0];
    expect(call.disabled).toBe(true);
  });

  it('honours an explicit disabled prop even when assets exist', () => {
    (useSnapAssetSelectorData as jest.Mock).mockReturnValue([
      {
        icon: 'i',
        symbol: 'SOL',
        name: 'Solana',
        balance: '1',
        fiat: '$1',
        chainId: 'solana:5eykt4',
        address: 'solana:5eykt4/token:abcd',
        networkName: 'Solana',
      },
    ]);

    render(
      <SnapUIAssetSelector
        name="asset"
        addresses={addresses}
        chainIds={chainIds}
        disabled
      />,
    );

    const call = (SnapUISelector as unknown as jest.Mock).mock.calls[0][0];
    expect(call.disabled).toBe(true);
  });
});
