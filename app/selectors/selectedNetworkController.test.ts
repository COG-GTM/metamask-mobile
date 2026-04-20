import { RootState } from '../reducers';
import {
  makeSelectChainId,
  makeSelectDomainIsConnectedDapp,
  makeSelectDomainNetworkClientId,
  makeSelectRpcUrl,
  selectNetworkClientIdsByDomains,
} from './selectedNetworkController';

jest.mock('../util/networks', () => ({
  __esModule: true,
  getNetworkImageSource: jest.fn(() => 'provider-image'),
  NetworkList: {
    mainnet: { name: 'Mainnet', chainId: '0x1' },
    rpc: { name: 'Private Network' },
  },
}));

jest.mock('../../locales/i18n', () => ({
  strings: jest.fn((k: string) => k),
}));

jest.mock('../core/Multichain/utils', () => ({
  isNonEvmChainId: jest.fn(() => false),
}));

const baseState = (overrides: Record<string, unknown> = {}) =>
  ({
    engine: {
      backgroundState: {
        SelectedNetworkController: {
          domains: { 'example.com': 'mainnet' },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Mainnet',
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  name: 'Mainnet RPC',
                  url: 'https://rpc',
                },
              ],
            },
          },
          networksMetadata: {},
        },
        MultichainNetworkController: {
          selectedMultichainNetworkChainId: 'bip122:000000000019d6689c085ae165831e93',
          isEvmSelected: true,
          multichainNetworkConfigurationsByChainId: {},
        },
        ...(overrides as Record<string, unknown>),
      },
    },
  } as unknown as RootState);

describe('selectedNetworkController selectors', () => {
  const originalFlag = process.env.MM_PER_DAPP_SELECTED_NETWORK;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.MM_PER_DAPP_SELECTED_NETWORK;
    } else {
      process.env.MM_PER_DAPP_SELECTED_NETWORK = originalFlag;
    }
  });

  it('selectNetworkClientIdsByDomains returns the domain → clientId map', () => {
    const state = baseState();
    expect(selectNetworkClientIdsByDomains(state)).toEqual({
      'example.com': 'mainnet',
    });
  });

  it('makeSelectDomainNetworkClientId returns the client id for a hostname', () => {
    const select = makeSelectDomainNetworkClientId();
    expect(select(baseState(), 'example.com')).toBe('mainnet');
    expect(select(baseState(), 'unknown.com')).toBeUndefined();
    expect(select(baseState(), undefined)).toBeUndefined();
  });

  it('makeSelectDomainIsConnectedDapp reports whether the domain is tracked', () => {
    const select = makeSelectDomainIsConnectedDapp();
    expect(select(baseState(), 'example.com')).toBe(true);
    expect(select(baseState(), 'unknown.com')).toBe(false);
    expect(select(baseState(), undefined)).toBe(false);
  });

  it('makeSelectChainId returns the provider chain id when no hostname / feature flag', () => {
    const select = makeSelectChainId();
    const result = select(baseState(), undefined);
    expect(typeof result).toBe('string');
  });

  it('makeSelectRpcUrl returns undefined for non-EVM chains', () => {
    const { isNonEvmChainId } = jest.requireMock('../core/Multichain/utils');
    isNonEvmChainId.mockReturnValueOnce(true);
    const select = makeSelectRpcUrl();
    expect(select(baseState(), undefined)).toBeUndefined();
  });
});
