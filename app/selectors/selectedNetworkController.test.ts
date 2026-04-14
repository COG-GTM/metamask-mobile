import { selectNetworkClientIdsByDomains, makeSelectDomainNetworkClientId, makeSelectDomainIsConnectedDapp } from './selectedNetworkController';

jest.mock('../util/networks', () => ({
  getNetworkImageSource: jest.fn().mockReturnValue('image-source'),
  getNetworkNameFromProviderConfig: jest.fn().mockReturnValue('Ethereum Mainnet'),
  NetworkList: {
    mainnet: { name: 'Ethereum Mainnet', chainId: '0x1', networkType: 'mainnet' },
    rpc: { name: 'Custom RPC' },
  },
}));

jest.mock('../../locales/i18n', () => ({
  strings: jest.fn().mockReturnValue('Unknown Network'),
}));

jest.mock('../core/Multichain/utils', () => ({
  isNonEvmChainId: jest.fn().mockReturnValue(false),
}));

const mockState = {
  engine: {
    backgroundState: {
      SelectedNetworkController: {
        domains: {
          'example.com': 'mainnet',
          'dapp.io': 'goerli',
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [{ networkClientId: 'mainnet', name: 'Ethereum', url: 'https://mainnet.infura.io' }],
          },
        },
      },
    },
  },
} as any;

describe('SelectedNetworkController Selectors', () => {
  it('selectNetworkClientIdsByDomains should return domains map', () => {
    const result = selectNetworkClientIdsByDomains(mockState);
    expect(result).toStrictEqual({
      'example.com': 'mainnet',
      'dapp.io': 'goerli',
    });
  });

  it('makeSelectDomainNetworkClientId should return client id for hostname', () => {
    const selector = makeSelectDomainNetworkClientId();
    const result = selector(mockState, 'example.com');
    expect(result).toBe('mainnet');
  });

  it('makeSelectDomainNetworkClientId should return undefined for unknown hostname', () => {
    const selector = makeSelectDomainNetworkClientId();
    const result = selector(mockState, 'unknown.com');
    expect(result).toBeUndefined();
  });

  it('makeSelectDomainIsConnectedDapp should return true for connected domain', () => {
    const selector = makeSelectDomainIsConnectedDapp();
    expect(selector(mockState, 'example.com')).toBe(true);
  });

  it('makeSelectDomainIsConnectedDapp should return false for unknown domain', () => {
    const selector = makeSelectDomainIsConnectedDapp();
    expect(selector(mockState, 'unknown.com')).toBe(false);
  });
});
