import {
  selectEvmNetworkImageSource,
  selectEvmNetworkName,
  selectNetworkImageSource,
  selectNetworkName,
} from './networkInfos';
import {
  getNetworkImageSource,
  getNetworkNameFromProviderConfig,
} from '../util/networks';
import { getNonEvmNetworkImageSourceByChainId } from '../util/networks/customNetworks';
import type { RootState } from '../reducers';

jest.mock('../util/networks', () => ({
  getNetworkImageSource: jest.fn(() => 'evm-image-source'),
  getNetworkNameFromProviderConfig: jest.fn(() => 'Ethereum'),
}));

jest.mock('../util/networks/customNetworks', () => ({
  getNonEvmNetworkImageSourceByChainId: jest.fn(() => 'non-evm-image-source'),
}));

const mockedGetNetworkImageSource = getNetworkImageSource as jest.Mock;
const mockedGetNetworkNameFromProviderConfig =
  getNetworkNameFromProviderConfig as jest.Mock;
const mockedGetNonEvm = getNonEvmNetworkImageSourceByChainId as jest.Mock;

const makeState = ({
  isEvmSelected,
  chainId = '0x1',
  nonEvmChainId = 'bip122:000000000019d6689c085ae165831e93',
  nonEvmName = 'Bitcoin',
}: {
  isEvmSelected: boolean;
  chainId?: string;
  nonEvmChainId?: string;
  nonEvmName?: string;
}) =>
  ({
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            [chainId]: {
              chainId,
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  url: 'https://rpc',
                  type: 'infura',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
        MultichainNetworkController: {
          isEvmSelected,
          selectedMultichainNetworkChainId: nonEvmChainId,
          multichainNetworkConfigurationsByChainId: {
            [nonEvmChainId]: { chainId: nonEvmChainId, name: nonEvmName },
          },
        },
      },
    },
  } as unknown as RootState);

describe('networkInfos selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNetworkImageSource.mockReturnValue('evm-image-source');
    mockedGetNetworkNameFromProviderConfig.mockReturnValue('Ethereum');
    mockedGetNonEvm.mockReturnValue('non-evm-image-source');
  });

  it('selectEvmNetworkName uses provider config to derive the name', () => {
    expect(selectEvmNetworkName(makeState({ isEvmSelected: true }))).toBe(
      'Ethereum',
    );
    expect(mockedGetNetworkNameFromProviderConfig).toHaveBeenCalled();
  });

  it('selectEvmNetworkImageSource derives image source from provider config', () => {
    expect(
      selectEvmNetworkImageSource(makeState({ isEvmSelected: true })),
    ).toBe('evm-image-source');
  });

  it('selectNetworkName returns the non-evm name when evm is not selected', () => {
    const state = makeState({
      isEvmSelected: false,
      nonEvmName: 'Bitcoin',
    });
    expect(selectNetworkName(state)).toBe('Bitcoin');
  });

  it('selectNetworkName returns the provider-derived name when evm is selected', () => {
    const state = makeState({ isEvmSelected: true });
    expect(selectNetworkName(state)).toBe('Ethereum');
  });

  it('selectNetworkImageSource delegates to non-evm helper when evm is not selected', () => {
    const state = makeState({ isEvmSelected: false });
    expect(selectNetworkImageSource(state)).toBe('non-evm-image-source');
    expect(mockedGetNonEvm).toHaveBeenCalled();
  });

  it('selectNetworkImageSource delegates to the evm helper when evm is selected', () => {
    const state = makeState({ isEvmSelected: true });
    expect(selectNetworkImageSource(state)).toBe('evm-image-source');
    expect(mockedGetNetworkImageSource).toHaveBeenCalled();
  });
});
