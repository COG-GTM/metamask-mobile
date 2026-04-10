// Hardcoded from ETHERSCAN_SUPPORTED_CHAIN_IDS at the time this migration was written.
const ETHERSCAN_SUPPORTED_CHAIN_IDS: Record<string, string> = {
  MAINNET: '0x1',
  GOERLI: '0x5',
  BSC: '0x38',
  BSC_TESTNET: '0x61',
  OPTIMISM: '0xa',
  OPTIMISM_SEPOLIA: '0xaa37dc',
  POLYGON: '0x89',
  POLYGON_TESTNET: '0x13881',
  AVALANCHE: '0xa86a',
  AVALANCHE_TESTNET: '0xa869',
  FANTOM: '0xfa',
  FANTOM_TESTNET: '0xfa2',
  SEPOLIA: '0xaa36a7',
  LINEA_GOERLI: '0xe704',
  LINEA_SEPOLIA: '0xe705',
  LINEA_MAINNET: '0xe708',
  MOONBEAM: '0x504',
  MOONBEAM_TESTNET: '0x507',
  MOONRIVER: '0x505',
  GNOSIS: '0x64',
  SEI: '0x531',
  MONAD: '0x8f',
};

export default function migrate(state: unknown) {
  const typedState = state as {
    privacy?: {
      thirdPartyApiMode?: boolean;
    };
    engine?: {
      backgroundState?: {
        PreferencesController?: {
          showIncomingTransactions?: Record<string, boolean>;
        };
      };
    };
  };
  try {
    Object.values(ETHERSCAN_SUPPORTED_CHAIN_IDS).forEach((hexChainId) => {
      const thirdPartyApiMode =
        typedState?.privacy?.thirdPartyApiMode ?? true;
      if (
        typedState?.engine?.backgroundState?.PreferencesController
          ?.showIncomingTransactions
      ) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          {
            ...typedState.engine.backgroundState.PreferencesController
              .showIncomingTransactions,
            [hexChainId]: thirdPartyApiMode,
          };
      } else if (typedState?.engine?.backgroundState?.PreferencesController) {
        typedState.engine.backgroundState.PreferencesController.showIncomingTransactions =
          { [hexChainId]: thirdPartyApiMode };
      }
    });

    if (typedState?.privacy?.thirdPartyApiMode !== undefined) {
      delete typedState.privacy.thirdPartyApiMode;
    }

    return state;
  } catch (e) {
    return state;
  }
}
