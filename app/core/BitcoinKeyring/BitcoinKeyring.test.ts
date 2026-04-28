import { BitcoinKeyring } from './BitcoinKeyring';
import { BitcoinNetwork } from './types';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function mnemonicToBytes(mnemonic: string): number[] {
  return Array.from(Buffer.from(mnemonic, 'utf8'));
}

describe('BitcoinKeyring', () => {
  let keyring: BitcoinKeyring;

  beforeEach(() => {
    keyring = new BitcoinKeyring();
  });

  describe('type', () => {
    it('has the correct static type', () => {
      expect(BitcoinKeyring.type).toBe('Bitcoin HD Key Tree');
    });

    it('exposes the type on the instance', () => {
      expect(keyring.type).toBe('Bitcoin HD Key Tree');
    });
  });

  describe('serialize / deserialize', () => {
    it('returns default state when no accounts exist', async () => {
      const state = await keyring.serialize();
      expect(state).toStrictEqual({
        mnemonic: undefined,
        numberOfAccounts: 0,
        nextDeriveIndex: 0,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
    });

    it('round-trips state through serialize/deserialize', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 1,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });

      const state = await keyring.serialize();
      expect(state.numberOfAccounts).toBe(1);
      expect(state.mnemonic).toBeDefined();
      expect(state.hdPath).toBe("m/84'/0'/0'");

      const keyring2 = new BitcoinKeyring();
      await keyring2.deserialize(state);
      const accounts1 = await keyring.getAccounts();
      const accounts2 = await keyring2.getAccounts();
      expect(accounts1).toStrictEqual(accounts2);
    });
  });

  describe('addAccounts', () => {
    beforeEach(async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 0,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
    });

    it('derives a mainnet Bech32 address', async () => {
      const addresses = await keyring.addAccounts(1);
      expect(addresses).toHaveLength(1);
      expect(addresses[0]).toMatch(/^bc1/u);
    });

    it('derives deterministic addresses', async () => {
      const first = await keyring.addAccounts(1);
      const keyring2 = new BitcoinKeyring();
      await keyring2.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 0,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
      const second = await keyring2.addAccounts(1);
      expect(first).toStrictEqual(second);
    });

    it('generates unique addresses for each index', async () => {
      const addresses = await keyring.addAccounts(3);
      expect(addresses).toHaveLength(3);
      const unique = new Set(addresses);
      expect(unique.size).toBe(3);
    });

    it('throws if mnemonic is not set', async () => {
      const empty = new BitcoinKeyring();
      await expect(empty.addAccounts(1)).rejects.toThrow('mnemonic not set');
    });
  });

  describe('getAccounts', () => {
    it('returns all derived addresses', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 2,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
      const accounts = await keyring.getAccounts();
      expect(accounts).toHaveLength(2);
    });

    it('returns empty array when no accounts exist', async () => {
      const accounts = await keyring.getAccounts();
      expect(accounts).toStrictEqual([]);
    });
  });

  describe('exportAccount', () => {
    it('exports a hex private key for a valid address', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 1,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
      const [address] = await keyring.getAccounts();
      const privKey = await keyring.exportAccount(address);
      expect(privKey).toMatch(/^[0-9a-f]{64}$/u);
    });

    it('throws for unknown address', async () => {
      await expect(keyring.exportAccount('bc1qunknown')).rejects.toThrow(
        'account not found',
      );
    });
  });

  describe('removeAccount', () => {
    it('removes an existing account', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 2,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
      const accounts = await keyring.getAccounts();
      keyring.removeAccount(accounts[0]);
      const remaining = await keyring.getAccounts();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toBe(accounts[1]);
    });

    it('throws for unknown address', () => {
      expect(() => keyring.removeAccount('bc1qunknown')).toThrow(
        'account not found',
      );
    });

    it('addAccounts after removeAccount derives a new unique address', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 0,
        hdPath: "m/84'/0'/0'",
        network: BitcoinNetwork.Mainnet,
      });
      const initial = await keyring.addAccounts(3);
      keyring.removeAccount(initial[0]);
      const added = await keyring.addAccounts(1);
      const remaining = await keyring.getAccounts();
      // The new address should not duplicate any existing address
      expect(added[0]).not.toBe(initial[0]);
      expect(added[0]).not.toBe(initial[1]);
      expect(added[0]).not.toBe(initial[2]);
      expect(remaining).toHaveLength(3);
      expect(new Set(remaining).size).toBe(3);
    });
  });

  describe('testnet support', () => {
    it('derives a testnet Bech32 address', async () => {
      await keyring.deserialize({
        mnemonic: mnemonicToBytes(TEST_MNEMONIC),
        numberOfAccounts: 0,
        hdPath: "m/84'/1'/0'",
        network: BitcoinNetwork.Testnet,
      });
      const addresses = await keyring.addAccounts(1);
      expect(addresses[0]).toMatch(/^tb1/u);
    });
  });

  describe('signing stubs', () => {
    it('signTransaction throws', async () => {
      await expect(keyring.signTransaction('addr', {})).rejects.toThrow(
        'not yet implemented',
      );
    });

    it('signMessage throws', async () => {
      await expect(keyring.signMessage('addr', 'msg')).rejects.toThrow(
        'not yet implemented',
      );
    });

    it('signPersonalMessage throws', async () => {
      await expect(
        keyring.signPersonalMessage('addr', 'msg'),
      ).rejects.toThrow('not yet implemented');
    });
  });
});
