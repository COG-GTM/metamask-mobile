import { filterTokensBySearch } from './filterTokensBySearch';
import { TokenI } from '../types';

describe('filterTokensBySearch', () => {
  const tokens: TokenI[] = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      address: '0x00',
      decimals: 18,
      aggregators: [],
      image: '',
      balance: '1',
      logo: undefined,
      isETH: true,
      chainId: '0x1',
      isNative: true,
    },
    {
      name: 'Basic Attention Token',
      symbol: 'BAT',
      address: '0x01',
      decimals: 18,
      aggregators: [],
      image: '',
      balance: '1',
      logo: undefined,
      isETH: false,
      chainId: '0x1',
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
      aggregators: [],
      image: '',
      balance: '1',
      logo: undefined,
      isETH: false,
      chainId: '0x1',
    },
  ];

  it('returns all tokens when the search query is empty', () => {
    expect(filterTokensBySearch(tokens, '')).toStrictEqual(tokens);
    expect(filterTokensBySearch(tokens, '   ')).toStrictEqual(tokens);
  });

  it('filters tokens by name', () => {
    expect(filterTokensBySearch(tokens, 'attention')).toStrictEqual([tokens[1]]);
  });

  it('filters tokens by symbol case-insensitively', () => {
    expect(filterTokensBySearch(tokens, 'usdc')).toStrictEqual([tokens[2]]);
  });

  it('filters tokens by address', () => {
    expect(filterTokensBySearch(tokens, '3606eb48')).toStrictEqual([tokens[2]]);
  });

  it('returns no tokens when nothing matches', () => {
    expect(filterTokensBySearch(tokens, 'polygon')).toStrictEqual([]);
  });
});
