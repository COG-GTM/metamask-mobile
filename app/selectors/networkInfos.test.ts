import { selectEvmNetworkName, selectEvmNetworkImageSource } from './networkInfos';

jest.mock('../util/networks', () => ({
  getNetworkNameFromProviderConfig: jest.fn().mockReturnValue('Ethereum Mainnet'),
  getNetworkImageSource: jest.fn().mockReturnValue('eth-image'),
}));

jest.mock('../util/networks/customNetworks', () => ({
  getNonEvmNetworkImageSourceByChainId: jest.fn().mockReturnValue('non-evm-image'),
}));

jest.mock('./networkController', () => ({
  selectProviderConfig: (state: any) => ({
    type: 'mainnet',
    chainId: '0x1',
    nickname: '',
  }),
}));

jest.mock('./multichainNetworkController', () => ({
  selectIsEvmNetworkSelected: () => true,
  selectSelectedNonEvmNetworkChainId: () => 'solana:mainnet',
  selectSelectedNonEvmNetworkName: () => 'Solana',
}));

describe('NetworkInfos Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
      },
    },
  } as any;

  it('selectEvmNetworkName should return network name', () => {
    const result = selectEvmNetworkName(mockState);
    expect(result).toBe('Ethereum Mainnet');
  });

  it('selectEvmNetworkImageSource should return image source', () => {
    const result = selectEvmNetworkImageSource(mockState);
    expect(result).toBe('eth-image');
  });
});
