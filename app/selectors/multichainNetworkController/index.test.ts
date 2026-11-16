import {
  selectMultichainNetworkControllerState,
  selectIsEvmNetworkSelected,
  selectSelectedNonEvmNetworkChainId,
  selectNonEvmNetworkConfigurationsByChainId,
  selectSelectedNonEvmNetworkName,
  selectSelectedNonEvmNativeCurrency,
  selectSelectedNonEvmNetworkSymbol,
  selectSelectedNonEvmNetworkDecimals,
} from './index';
import { RootState } from '../../reducers';
import { BtcScope, SolScope } from '@metamask/keyring-api';
import imageIcons from '../../images/image-icons';

describe('Multichain Network Controller Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        MultichainNetworkController: {
          isEvmSelected: true,
          selectedMultichainNetworkChainId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          multichainNetworkConfigurationsByChainId: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              name: 'Solana Mainnet',
              nativeCurrency: 'solana:sol/token:sol',
              ticker: 'SOL',
              decimals: 9,
            },
          },
        },
      },
    },
  } as unknown as RootState;

  describe('selectMultichainNetworkControllerState', () => {
    it('should return the multichain network controller state', () => {
      const result = selectMultichainNetworkControllerState(mockState);
      expect(result).toBe(
        mockState.engine.backgroundState.MultichainNetworkController,
      );
    });
  });

  describe('selectIsEvmNetworkSelected', () => {
    it('should return isEvmSelected value', () => {
      const result = selectIsEvmNetworkSelected(mockState);
      expect(result).toBe(true);
    });
  });

  describe('selectSelectedNonEvmNetworkChainId', () => {
    it('should return the selected non-EVM network chain ID', () => {
      const result = selectSelectedNonEvmNetworkChainId(mockState);
      expect(result).toBe('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
    });
  });

  describe('selectNonEvmNetworkConfigurationsByChainId', () => {
    it('should return the non-EVM network configurations', () => {
      const result = selectNonEvmNetworkConfigurationsByChainId(mockState);
      expect(result).toEqual(
        mockState.engine.backgroundState.MultichainNetworkController
          .multichainNetworkConfigurationsByChainId,
      );
    });
  });

  describe('selectSelectedNonEvmNetworkName', () => {
    it('should return the selected network name', () => {
      const result = selectSelectedNonEvmNetworkName(mockState);
      expect(result).toBe('Solana Mainnet');
    });

    it('should return undefined when network is not found', () => {
      const modifiedState = {
        ...mockState,
        engine: {
          backgroundState: {
            MultichainNetworkController: {
              ...mockState.engine.backgroundState.MultichainNetworkController,
              selectedMultichainNetworkChainId: 'unknown:chain-id',
            },
          },
        },
      } as unknown as RootState;
      const result = selectSelectedNonEvmNetworkName(modifiedState);
      expect(result).toBeUndefined();
    });
  });

  describe('selectSelectedNonEvmNativeCurrency', () => {
    it('should return the selected network native currency', () => {
      const result = selectSelectedNonEvmNativeCurrency(mockState);
      expect(result).toBe('solana:sol/token:sol');
    });

    it('should return undefined when network is not found', () => {
      const modifiedState = {
        ...mockState,
        engine: {
          backgroundState: {
            MultichainNetworkController: {
              ...mockState.engine.backgroundState.MultichainNetworkController,
              selectedMultichainNetworkChainId: 'unknown:chain-id',
            },
          },
        },
      } as unknown as RootState;
      const result = selectSelectedNonEvmNativeCurrency(modifiedState);
      expect(result).toBeUndefined();
    });
  });

  describe('selectSelectedNonEvmNetworkSymbol', () => {
    it('should return the selected network symbol', () => {
      const result = selectSelectedNonEvmNetworkSymbol(mockState);
      expect(result).toBe('SOL');
    });

    it('should return undefined when network symbol is not found', () => {
      const modifiedState = {
        ...mockState,
        engine: {
          backgroundState: {
            MultichainNetworkController: {
              ...mockState.engine.backgroundState.MultichainNetworkController,
              selectedMultichainNetworkChainId: 'unknown:chain-id',
            },
          },
        },
      } as unknown as RootState;
      const result = selectSelectedNonEvmNetworkSymbol(modifiedState);
      expect(result).toBeUndefined();
    });
  });

  describe('non-EVM testnet filtering and extended data merge', () => {
    const buildState = (
      multichainNetworkConfigurationsByChainId: Record<string, unknown>,
      selectedMultichainNetworkChainId: string = SolScope.Mainnet,
    ) =>
      ({
        engine: {
          backgroundState: {
            MultichainNetworkController: {
              isEvmSelected: false,
              selectedMultichainNetworkChainId,
              multichainNetworkConfigurationsByChainId,
            },
          },
        },
      } as unknown as RootState);

    const networkConfigurations = {
      [SolScope.Mainnet]: {
        chainId: SolScope.Mainnet,
        name: 'Solana Mainnet',
        nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
        isEvm: false,
      },
      [SolScope.Devnet]: {
        chainId: SolScope.Devnet,
        name: 'Solana Devnet',
        nativeCurrency: `${SolScope.Devnet}/slip44:501`,
        isEvm: false,
      },
      [SolScope.Testnet]: {
        chainId: SolScope.Testnet,
        name: 'Solana Testnet',
        nativeCurrency: `${SolScope.Testnet}/slip44:501`,
        isEvm: false,
      },
      [BtcScope.Mainnet]: {
        chainId: BtcScope.Mainnet,
        name: 'Bitcoin Mainnet',
        nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
        isEvm: false,
        // Controller-provided values must be overridden by the hard-coded data
        decimals: 0,
        ticker: 'XBT',
      },
      [BtcScope.Testnet]: {
        chainId: BtcScope.Testnet,
        name: 'Bitcoin Testnet',
        nativeCurrency: `${BtcScope.Testnet}/slip44:0`,
        isEvm: false,
      },
      [BtcScope.Signet]: {
        chainId: BtcScope.Signet,
        name: 'Bitcoin Signet',
        nativeCurrency: `${BtcScope.Signet}/slip44:0`,
        isEvm: false,
      },
    };

    it('excludes Solana and Bitcoin testnets', () => {
      const result = selectNonEvmNetworkConfigurationsByChainId(
        buildState(networkConfigurations),
      );
      expect(Object.keys(result).sort()).toEqual(
        [SolScope.Mainnet, BtcScope.Mainnet].sort(),
      );
      expect(result).not.toHaveProperty(SolScope.Devnet);
      expect(result).not.toHaveProperty(SolScope.Testnet);
      expect(result).not.toHaveProperty(BtcScope.Testnet);
      expect(result).not.toHaveProperty(BtcScope.Signet);
    });

    it('merges Solana decimals, ticker and image into the mainnet config', () => {
      const result = selectNonEvmNetworkConfigurationsByChainId(
        buildState(networkConfigurations),
      );
      expect(result[SolScope.Mainnet]).toEqual({
        ...networkConfigurations[SolScope.Mainnet],
        decimals: 9,
        ticker: 'SOL',
        imageSource: imageIcons.SOLANA,
      });
    });

    it('merges Bitcoin decimals, ticker and image, overriding controller values', () => {
      const result = selectNonEvmNetworkConfigurationsByChainId(
        buildState(networkConfigurations),
      );
      expect(result[BtcScope.Mainnet]).toEqual({
        ...networkConfigurations[BtcScope.Mainnet],
        decimals: 8,
        ticker: 'BTC',
        imageSource: imageIcons.BTC,
      });
    });

    it('returns an empty object when there are no network configurations', () => {
      expect(
        selectNonEvmNetworkConfigurationsByChainId(
          buildState(undefined as unknown as Record<string, unknown>),
        ),
      ).toEqual({});
    });

    it('selectSelectedNonEvmNetworkDecimals returns 9 for Solana mainnet', () => {
      expect(
        selectSelectedNonEvmNetworkDecimals(buildState(networkConfigurations)),
      ).toBe(9);
    });

    it('selectSelectedNonEvmNetworkDecimals returns 8 for Bitcoin mainnet', () => {
      expect(
        selectSelectedNonEvmNetworkDecimals(
          buildState(networkConfigurations, BtcScope.Mainnet),
        ),
      ).toBe(8);
    });

    it('selectSelectedNonEvmNetworkDecimals returns undefined for an unknown chain', () => {
      expect(
        selectSelectedNonEvmNetworkDecimals(
          buildState(networkConfigurations, 'unknown:chain-id'),
        ),
      ).toBeUndefined();
    });

    it('selectSelectedNonEvmNetworkDecimals returns undefined for a filtered testnet', () => {
      expect(
        selectSelectedNonEvmNetworkDecimals(
          buildState(networkConfigurations, SolScope.Devnet),
        ),
      ).toBeUndefined();
    });

    it('selectSelectedNonEvmNetworkSymbol returns BTC for Bitcoin mainnet', () => {
      expect(
        selectSelectedNonEvmNetworkSymbol(
          buildState(networkConfigurations, BtcScope.Mainnet),
        ),
      ).toBe('BTC');
    });
  });
});
