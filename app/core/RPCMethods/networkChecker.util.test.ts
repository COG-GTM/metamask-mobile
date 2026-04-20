import axios from 'axios';
import { toHex } from '@metamask/controller-utils';
import checkSafeNetwork from './networkChecker.util';
import { BannerAlertSeverity } from '../../component-library/components/Banners/Banner';

jest.mock('axios');

jest.mock('../../util/networks/customNetworks', () => ({
  PopularList: [
    {
      chainId: '0x38',
      nickname: 'BNB Chain',
      ticker: 'BNB',
      rpcUrl: 'https://bsc-dataseed.bnbchain.org/',
    },
  ],
}));

jest.mock('../../../locales/i18n', () => ({
  strings: (key: string) => key,
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('checkSafeNetwork', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  const setChainsResponse = (chains: unknown) => {
    mockedAxios.get.mockResolvedValue({ data: chains });
  };

  it('returns unknown_chain alert when chain id does not match any safe chain', async () => {
    setChainsResponse([]);
    const alerts = await checkSafeNetwork(
      '12345',
      'https://example.com/rpc',
      'Example',
      'EXM',
    );
    expect(alerts).toEqual([
      expect.objectContaining({
        alertSeverity: BannerAlertSeverity.Error,
        alertOrigin: 'unknown_chain',
      }),
    ]);
  });

  it('returns no alerts for a matching safe chain with matching rpc and metadata', async () => {
    setChainsResponse([
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', decimals: 18 },
        rpc: ['https://mainnet.example.org/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.example.org/',
      'Ethereum Mainnet',
      'ETH',
    );
    expect(alerts).toEqual([]);
  });

  it('returns invalid_rpc_url alert when rpc url is not in safe chain rpcs', async () => {
    setChainsResponse([
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', decimals: 18 },
        rpc: ['https://mainnet.example.org/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '1',
      'https://evil.example.org/',
      'Ethereum Mainnet',
      'ETH',
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({ alertOrigin: 'rpc_url' }),
    );
  });

  it('allows an rpc url when it matches a popular network entry', async () => {
    setChainsResponse([
      {
        chainId: 56,
        name: 'BNB Chain',
        nativeCurrency: { symbol: 'BNB', decimals: 18 },
        rpc: ['https://different.example/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '56',
      'https://bsc-dataseed.bnbchain.org',
      'BNB Chain',
      'BNB',
    );
    expect(alerts).toEqual([]);
    expect(toHex('56')).toBe('0x38');
  });

  it('warns when native currency decimals differ from EVM default', async () => {
    setChainsResponse([
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', decimals: 6 },
        rpc: ['https://mainnet.example.org/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.example.org/',
      'Ethereum Mainnet',
      'ETH',
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({ alertOrigin: 'decimals' }),
    );
  });

  it('warns when nickname differs from safe chain name', async () => {
    setChainsResponse([
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', decimals: 18 },
        rpc: ['https://mainnet.example.org/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.example.org/',
      'Totally Not Ethereum',
      'ETH',
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({ alertOrigin: 'chain_name' }),
    );
  });

  it('warns when ticker differs from safe chain native symbol', async () => {
    setChainsResponse([
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', decimals: 18 },
        rpc: ['https://mainnet.example.org/'],
      },
    ]);

    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.example.org/',
      'Ethereum Mainnet',
      'FAKE',
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({ alertOrigin: 'chain_ticker' }),
    );
  });
});
