import { renderHook } from '@testing-library/react-hooks';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../selectors/accountsController', () => ({
  getMemoizedInternalAccountByAddress: jest.fn(),
}));
jest.mock('../../../selectors/multichain', () => ({
  selectMultichainTokenListForAccountId: jest.fn(),
}));
jest.mock('../../../selectors/networkController', () => ({
  selectNetworkConfigurations: jest.fn(),
}));
jest.mock('../../../selectors/currencyRateController', () => ({
  selectCurrentCurrency: jest.fn(),
}));
jest.mock('../../../util/networks/customNetworks', () => ({
  getNonEvmNetworkImageSourceByChainId: jest.fn(() => 'network-icon'),
}));

import { useSnapAssetSelectorData } from './useSnapAssetDisplay';
import { getMemoizedInternalAccountByAddress } from '../../../selectors/accountsController';
import { selectMultichainTokenListForAccountId } from '../../../selectors/multichain';
import { selectNetworkConfigurations } from '../../../selectors/networkController';
import { selectCurrentCurrency } from '../../../selectors/currencyRateController';

describe('useSnapAssetSelectorData', () => {
  const assetFixture = {
    image: 'https://img',
    symbol: 'SOL',
    name: 'Solana',
    balance: '1.23',
    secondary: '100',
    chainId: 'solana:5eykt4',
    address: 'solana:5eykt4/token:abcd',
  };

  const setupSelectors = (opts: {
    currency?: string;
    account?: unknown;
    assets?: unknown[];
    networks?: Record<string, unknown>;
  }) => {
    const {
      currency = 'usd',
      account = { id: 'account-1' },
      assets = [assetFixture],
      networks = {},
    } = opts;
    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === selectCurrentCurrency) return currency;
      if (selector === selectNetworkConfigurations) return networks;
      if (typeof selector === 'function') {
        const fnSource = (selector as () => unknown).toString();
        if (fnSource.includes('getMemoizedInternalAccountByAddress')) {
          return account;
        }
        if (fnSource.includes('selectMultichainTokenListForAccountId')) {
          return assets;
        }
      }
      return undefined;
    });
    (getMemoizedInternalAccountByAddress as jest.Mock).mockReturnValue(account);
    (selectMultichainTokenListForAccountId as jest.Mock).mockReturnValue(
      assets,
    );
  };

  it('formats assets and preserves them when no chain filter is provided', () => {
    setupSelectors({});

    const { result } = renderHook(() =>
      useSnapAssetSelectorData({
        addresses: [
          'solana:5eykt4:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT',
        ],
      }),
    );

    expect(result.current).toHaveLength(1);
    const [asset] = result.current;
    expect(asset.symbol).toBe('SOL');
    expect(asset.name).toBe('Solana');
    expect(asset.address).toBe(assetFixture.address);
    expect(asset.icon).toBe(assetFixture.image);
    // balance and fiat are formatted strings.
    expect(typeof asset.balance).toBe('string');
    expect(typeof asset.fiat).toBe('string');
  });

  it('filters assets by the provided chainIds', () => {
    setupSelectors({});
    const { result } = renderHook(() =>
      useSnapAssetSelectorData({
        addresses: [
          'solana:5eykt4:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT',
        ],
        chainIds: ['solana:5eykt4'],
      }),
    );

    expect(result.current).toHaveLength(1);
  });

  it('excludes assets whose chainId does not match the filter', () => {
    setupSelectors({});
    const { result } = renderHook(() =>
      useSnapAssetSelectorData({
        addresses: [
          'solana:5eykt4:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT',
        ],
        chainIds: ['eip155:1'],
      }),
    );

    expect(result.current).toEqual([]);
  });

  it('returns an empty array when there are no assets', () => {
    setupSelectors({ assets: [] });
    const { result } = renderHook(() =>
      useSnapAssetSelectorData({
        addresses: [
          'solana:5eykt4:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT',
        ],
      }),
    );
    expect(result.current).toEqual([]);
  });
});
