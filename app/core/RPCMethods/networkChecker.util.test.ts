import checkSafeNetwork from './networkChecker.util';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('checkSafeNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns unrecognized chain alert for unknown chainId', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    const alerts = await checkSafeNetwork('999999', 'https://example.com', 'Test', 'TST');
    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alertOrigin: 'unknown_chain',
        }),
      ]),
    );
  });

  it('returns empty alerts for matching chain', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpc: ['https://mainnet.infura.io'],
          nativeCurrency: { symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.infura.io',
      'Ethereum Mainnet',
      'ETH',
    );
    expect(alerts).toEqual([]);
  });

  it('returns invalid rpc alert for mismatched rpc', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpc: ['https://mainnet.infura.io'],
          nativeCurrency: { symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    const alerts = await checkSafeNetwork(
      '1',
      'https://evil-rpc.com',
      'Ethereum Mainnet',
      'ETH',
    );
    expect(alerts.some((a: any) => a.alertOrigin === 'rpc_url')).toBe(true);
  });

  it('returns chain name alert for mismatched name', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpc: ['https://mainnet.infura.io'],
          nativeCurrency: { symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.infura.io',
      'Wrong Name',
      'ETH',
    );
    expect(alerts.some((a: any) => a.alertOrigin === 'chain_name')).toBe(true);
  });

  it('returns ticker alert for mismatched symbol', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpc: ['https://mainnet.infura.io'],
          nativeCurrency: { symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    const alerts = await checkSafeNetwork(
      '1',
      'https://mainnet.infura.io',
      'Ethereum Mainnet',
      'WRONG',
    );
    expect(alerts.some((a: any) => a.alertOrigin === 'chain_ticker')).toBe(true);
  });
});
