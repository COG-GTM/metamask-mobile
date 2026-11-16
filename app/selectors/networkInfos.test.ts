import { SolScope, BtcScope } from '@metamask/keyring-api';
import { CaipChainId } from '@metamask/utils';
import { RootState } from '../reducers';
import { backgroundState } from '../util/test/initial-root-state';
import { getNetworkImageSource } from '../util/networks';
import { getNonEvmNetworkImageSourceByChainId } from '../util/networks/customNetworks';
import {
  selectEvmNetworkImageSource,
  selectEvmNetworkName,
  selectNetworkImageSource,
  selectNetworkName,
} from './networkInfos';

const EVM_IMAGE = 'evm-network-image';
const NON_EVM_IMAGE = 'non-evm-network-image';

jest.mock('../util/networks', () => ({
  ...jest.requireActual('../util/networks'),
  getNetworkImageSource: jest.fn(() => 'evm-network-image'),
}));

jest.mock('../util/networks/customNetworks', () => ({
  ...jest.requireActual('../util/networks/customNetworks'),
  getNonEvmNetworkImageSourceByChainId: jest.fn(() => 'non-evm-network-image'),
}));

const mockGetNetworkImageSource = jest.mocked(getNetworkImageSource);
const mockGetNonEvmNetworkImageSourceByChainId = jest.mocked(
  getNonEvmNetworkImageSourceByChainId,
);

const buildState = ({
  isEvmSelected,
  selectedNetworkClientId = 'mainnet',
  selectedMultichainNetworkChainId = SolScope.Mainnet,
}: {
  isEvmSelected: boolean;
  selectedNetworkClientId?: string;
  selectedMultichainNetworkChainId?: CaipChainId;
}): RootState =>
  ({
    engine: {
      backgroundState: {
        ...backgroundState,
        NetworkController: {
          ...backgroundState.NetworkController,
          selectedNetworkClientId,
        },
        MultichainNetworkController: {
          ...backgroundState.MultichainNetworkController,
          isEvmSelected,
          selectedMultichainNetworkChainId,
        },
      },
    },
  } as unknown as RootState);

describe('networkInfos selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectNetworkName', () => {
    it('returns the provider config name when EVM is selected', () => {
      expect(selectNetworkName(buildState({ isEvmSelected: true }))).toBe(
        'Ethereum Main Network',
      );
    });

    it('returns the custom RPC nickname when EVM is selected on a custom network', () => {
      const state = buildState({
        isEvmSelected: true,
        selectedNetworkClientId: 'megaeth-testnet',
      });

      expect(selectNetworkName(state)).toBe('Mega Testnet');
    });

    it('returns the Solana network name when non-EVM Solana is selected', () => {
      const state = buildState({
        isEvmSelected: false,
        selectedMultichainNetworkChainId: SolScope.Mainnet,
      });

      expect(selectNetworkName(state)).toBe('Solana');
    });

    it('returns the Bitcoin network name when non-EVM Bitcoin is selected', () => {
      const state = buildState({
        isEvmSelected: false,
        selectedMultichainNetworkChainId: BtcScope.Mainnet,
      });

      expect(selectNetworkName(state)).toBe('Bitcoin');
    });

    it('ignores the non-EVM network name when EVM is selected', () => {
      const state = buildState({
        isEvmSelected: true,
        selectedMultichainNetworkChainId: SolScope.Mainnet,
      });

      expect(selectNetworkName(state)).not.toBe('Solana');
      expect(selectNetworkName(state)).toBe(selectEvmNetworkName(state));
    });
  });

  describe('selectNetworkImageSource', () => {
    it('returns the provider config image when EVM is selected', () => {
      const state = buildState({ isEvmSelected: true });

      expect(selectNetworkImageSource(state)).toBe(EVM_IMAGE);
      expect(mockGetNetworkImageSource).toHaveBeenCalledWith({
        networkType: 'mainnet',
        chainId: '0x1',
      });
      expect(mockGetNonEvmNetworkImageSourceByChainId).not.toHaveBeenCalled();
    });

    it('passes the custom RPC provider config when EVM is selected on a custom network', () => {
      const state = buildState({
        isEvmSelected: true,
        selectedNetworkClientId: 'megaeth-testnet',
      });

      expect(selectNetworkImageSource(state)).toBe(EVM_IMAGE);
      expect(mockGetNetworkImageSource).toHaveBeenCalledWith({
        networkType: 'rpc',
        chainId: '0x18c6',
      });
    });

    it.each([
      ['Solana', SolScope.Mainnet],
      ['Bitcoin', BtcScope.Mainnet],
    ])(
      'returns the non-EVM image for %s when non-EVM is selected',
      (_name, chainId) => {
        const state = buildState({
          isEvmSelected: false,
          selectedMultichainNetworkChainId: chainId,
        });

        expect(selectNetworkImageSource(state)).toBe(NON_EVM_IMAGE);
        expect(mockGetNonEvmNetworkImageSourceByChainId).toHaveBeenCalledWith(
          chainId,
        );
        expect(mockGetNetworkImageSource).not.toHaveBeenCalled();
      },
    );
  });

  describe('selectEvmNetworkName', () => {
    it('returns the provider config name regardless of non-EVM selection', () => {
      const state = buildState({ isEvmSelected: false });

      expect(selectEvmNetworkName(state)).toBe('Ethereum Main Network');
    });
  });

  describe('selectEvmNetworkImageSource', () => {
    it('returns the provider config image regardless of non-EVM selection', () => {
      const state = buildState({ isEvmSelected: false });

      expect(selectEvmNetworkImageSource(state)).toBe(EVM_IMAGE);
      expect(mockGetNetworkImageSource).toHaveBeenCalledWith({
        networkType: 'mainnet',
        chainId: '0x1',
      });
      expect(mockGetNonEvmNetworkImageSourceByChainId).not.toHaveBeenCalled();
    });
  });
});
