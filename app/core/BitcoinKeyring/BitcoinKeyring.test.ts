///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import {
  BitcoinKeyring,
  BitcoinNetwork,
  bitcoinKeyringBuilder,
} from './BitcoinKeyring';

// BIP-39 test vector mnemonic from `bitcoinjs/bip39` test fixtures. Using a
// fixed mnemonic keeps derivation deterministic across CI runs.
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Expected BIP-84 native SegWit (P2WPKH) addresses for the standard `abandon`
// test mnemonic at `m/84'/0'/0'/0/{i}`. Source: BIP-84 reference test vectors.
const EXPECTED_MAINNET_ADDRESSES = [
  'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
  'bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g',
];

describe('BitcoinKeyring', () => {
  it('exposes the canonical keyring type string', () => {
    expect(BitcoinKeyring.type).toBe('Bitcoin HD Key Tree');
    expect(new BitcoinKeyring().type).toBe('Bitcoin HD Key Tree');
  });

  it('derives BIP-84 native SegWit addresses for the BIP-39 test mnemonic', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({ mnemonic: TEST_MNEMONIC });

    const accounts = await keyring.addAccounts(2);

    expect(accounts).toEqual(EXPECTED_MAINNET_ADDRESSES);
    expect(await keyring.getAccounts()).toEqual(EXPECTED_MAINNET_ADDRESSES);
  });

  it('uses the testnet HRP when configured for testnet', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({
      mnemonic: TEST_MNEMONIC,
      network: BitcoinNetwork.Testnet,
    });

    const [address] = await keyring.addAccounts(1);

    expect(address.startsWith('tb1')).toBe(true);
  });

  it('round-trips through serialize / deserialize', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({ mnemonic: TEST_MNEMONIC });
    await keyring.addAccounts(2);

    const state = await keyring.serialize();
    expect(state.numberOfAccounts).toBe(2);
    expect(state.network).toBe(BitcoinNetwork.Mainnet);

    const restored = new BitcoinKeyring();
    await restored.deserialize(state);

    expect(await restored.getAccounts()).toEqual(EXPECTED_MAINNET_ADDRESSES);
  });

  it('generates a fresh mnemonic when one is not provided', async () => {
    const a = new BitcoinKeyring();
    await a.deserialize();
    await a.addAccounts(1);

    const b = new BitcoinKeyring();
    await b.deserialize();
    await b.addAccounts(1);

    const [addressA] = await a.getAccounts();
    const [addressB] = await b.getAccounts();
    expect(addressA).not.toBe(addressB);
    expect(addressA.startsWith('bc1')).toBe(true);
  });

  it('removes a tracked address', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({
      mnemonic: TEST_MNEMONIC,
      numberOfAccounts: 2,
    });

    await keyring.removeAccount(EXPECTED_MAINNET_ADDRESSES[0]);

    expect(await keyring.getAccounts()).toEqual([
      EXPECTED_MAINNET_ADDRESSES[1],
    ]);
  });

  it('throws when removing or exporting an unknown address', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({ mnemonic: TEST_MNEMONIC });

    await expect(keyring.removeAccount('bc1qunknown')).rejects.toThrow(
      'unknown address',
    );
    await expect(keyring.exportAccount('bc1qunknown')).rejects.toThrow(
      'unknown address',
    );
  });

  it('exports a deterministic 32-byte hex private key', async () => {
    const keyring = new BitcoinKeyring();
    await keyring.deserialize({
      mnemonic: TEST_MNEMONIC,
      numberOfAccounts: 1,
    });

    const [address] = await keyring.getAccounts();
    const privateKey = await keyring.exportAccount(address);

    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/u);
  });
});

describe('bitcoinKeyringBuilder', () => {
  it('produces a builder tagged with the keyring type', () => {
    const builder = bitcoinKeyringBuilder();
    expect(builder.type).toBe(BitcoinKeyring.type);
    expect(builder()).toBeInstanceOf(BitcoinKeyring);
  });

  it('forwards default options to the keyring instance', () => {
    const builder = bitcoinKeyringBuilder({ network: BitcoinNetwork.Testnet });
    const keyring = builder();
    expect(keyring.network).toBe(BitcoinNetwork.Testnet);
  });
});
///: END:ONLY_INCLUDE_IF
