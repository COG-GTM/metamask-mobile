import {
  selectNetworkClientIdsByDomains,
  makeSelectDomainNetworkClientId,
  makeSelectDomainIsConnectedDapp,
} from './selectedNetworkController';

const mockState = {
  engine: {
    backgroundState: {
      SelectedNetworkController: {
        domains: {
          'https://example.com': 'mainnet',
          'https://test.com': 'sepolia',
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            rpcEndpoints: [{ url: 'https://mainnet.infura.io', networkClientId: 'mainnet' }],
          },
        },
      },
    },
  },
} as any;

describe('selectedNetworkController selectors', () => {
  it('selectNetworkClientIdsByDomains returns domains', () => {
    const result = selectNetworkClientIdsByDomains(mockState);
    expect(result).toEqual({
      'https://example.com': 'mainnet',
      'https://test.com': 'sepolia',
    });
  });

  it('makeSelectDomainNetworkClientId returns selector that resolves domain', () => {
    const selectDomainNetworkClientId = makeSelectDomainNetworkClientId();
    const result = selectDomainNetworkClientId(mockState, 'https://example.com');
    expect(result).toBe('mainnet');
  });

  it('makeSelectDomainNetworkClientId returns undefined for unknown domain', () => {
    const selectDomainNetworkClientId = makeSelectDomainNetworkClientId();
    const result = selectDomainNetworkClientId(mockState, 'https://unknown.com');
    expect(result).toBeUndefined();
  });

  it('makeSelectDomainIsConnectedDapp returns true for connected domain', () => {
    const selectDomainIsConnectedDapp = makeSelectDomainIsConnectedDapp();
    const result = selectDomainIsConnectedDapp(mockState, 'https://example.com');
    expect(result).toBe(true);
  });

  it('makeSelectDomainIsConnectedDapp returns false for unknown domain', () => {
    const selectDomainIsConnectedDapp = makeSelectDomainIsConnectedDapp();
    const result = selectDomainIsConnectedDapp(mockState, 'https://unknown.com');
    expect(result).toBe(false);
  });
});
