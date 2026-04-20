import {
  MOCK_ACCOUNT_CONTROLLER_STATE,
  MOCK_KEYRING_CONTROLLER_STATE,
  MOCK_MULTICHAIN_NETWORK_CONTROLLER_STATE,
  MOCK_NETWORK_CONTROLLER_STATE,
} from './mock-data';

describe('confirmations mock-data', () => {
  describe('MOCK_NETWORK_CONTROLLER_STATE', () => {
    it('defines a Sepolia network configuration', () => {
      const sepolia =
        MOCK_NETWORK_CONTROLLER_STATE.networkConfigurationsByChainId['0xaa36a7'];
      expect(sepolia.name).toBe('Sepolia');
      expect(sepolia.nativeCurrency).toBe('SepoliaETH');
      expect(sepolia.rpcEndpoints[0].networkClientId).toBe('sepolia');
    });

    it('defines a Mega Testnet network configuration', () => {
      const mega =
        MOCK_NETWORK_CONTROLLER_STATE.networkConfigurationsByChainId['0x18c6'];
      expect(mega.name).toBe('Mega Testnet');
      expect(mega.blockExplorerUrls).toContain('https://megaexplorer.xyz');
    });
  });

  describe('MOCK_MULTICHAIN_NETWORK_CONTROLLER_STATE', () => {
    it('treats EVM as the selected namespace', () => {
      expect(MOCK_MULTICHAIN_NETWORK_CONTROLLER_STATE.isEvmSelected).toBe(true);
    });

    it('contains Bitcoin and Solana non-EVM network configurations', () => {
      const configs =
        MOCK_MULTICHAIN_NETWORK_CONTROLLER_STATE.multichainNetworkConfigurationsByChainId;
      expect(
        configs['bip122:000000000019d6689c085ae165831e93'].isEvm,
      ).toBe(false);
      expect(
        configs['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'].isEvm,
      ).toBe(false);
    });
  });

  describe('MOCK_ACCOUNT_CONTROLLER_STATE', () => {
    it('exposes three internal accounts keyed by uuid', () => {
      expect(
        Object.keys(MOCK_ACCOUNT_CONTROLLER_STATE.internalAccounts.accounts),
      ).toHaveLength(3);
    });

    it('has selectedAccount pointing to one of the internal accounts', () => {
      const { selectedAccount, accounts } =
        MOCK_ACCOUNT_CONTROLLER_STATE.internalAccounts;
      expect(accounts[selectedAccount]).toBeDefined();
      expect(accounts[selectedAccount].metadata.name).toBe('Account 1');
    });
  });

  describe('MOCK_KEYRING_CONTROLLER_STATE', () => {
    it('reports an unlocked keyring', () => {
      expect(MOCK_KEYRING_CONTROLLER_STATE.isUnlocked).toBe(true);
    });

    it('lists an HD keyring with the same accounts as MOCK_ACCOUNT_CONTROLLER_STATE', () => {
      const hdKeyring = MOCK_KEYRING_CONTROLLER_STATE.keyrings.find(
        (kr) => kr.type === 'HD Key Tree',
      );
      expect(hdKeyring).toBeDefined();
      expect(hdKeyring.accounts).toHaveLength(3);
    });

    it('includes an (empty) QR hardware keyring', () => {
      const qrKeyring = MOCK_KEYRING_CONTROLLER_STATE.keyrings.find(
        (kr) => kr.type === 'QR Hardware Wallet Device',
      );
      expect(qrKeyring).toBeDefined();
      expect(qrKeyring.accounts).toStrictEqual([]);
    });

    it('has a keyringsMetadata entry per keyring', () => {
      expect(MOCK_KEYRING_CONTROLLER_STATE.keyringsMetadata).toHaveLength(
        MOCK_KEYRING_CONTROLLER_STATE.keyrings.length,
      );
    });
  });
});
