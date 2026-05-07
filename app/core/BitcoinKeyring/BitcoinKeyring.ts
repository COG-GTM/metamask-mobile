///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { mnemonicToSeed, generateMnemonic } from '@metamask/scure-bip39';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { SLIP10Node } from '@metamask/key-tree';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bech32 } from 'bech32';
import { bytesToHex } from '@metamask/utils';

/**
 * Supported Bitcoin networks.
 */
export enum BitcoinNetwork {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

const NETWORK_HRP: Record<BitcoinNetwork, string> = {
  [BitcoinNetwork.Mainnet]: 'bc',
  [BitcoinNetwork.Testnet]: 'tb',
};

const COIN_TYPE: Record<BitcoinNetwork, number> = {
  [BitcoinNetwork.Mainnet]: 0,
  [BitcoinNetwork.Testnet]: 1,
};

/**
 * BIP-84 purpose for native SegWit (P2WPKH) addresses.
 */
const PURPOSE = 84;

/**
 * Persisted serialised state for a {@link BitcoinKeyring}.
 */
export interface BitcoinKeyringState {
  mnemonic: string;
  numberOfAccounts: number;
  network: BitcoinNetwork;
  accountIndex: number;
}

/**
 * Options accepted by {@link BitcoinKeyring.deserialize}.
 *
 * `mnemonic` is optional — when omitted, a new BIP-39 mnemonic is generated
 * the first time accounts are added.
 */
export interface BitcoinKeyringOptions {
  mnemonic?: string;
  numberOfAccounts?: number;
  network?: BitcoinNetwork;
  accountIndex?: number;
}

/**
 * Apply BIP-141 / BIP-173 segwit address encoding to a 20-byte hash160.
 *
 * @param hash160 - The 20-byte RIPEMD160(SHA256(pubkey)) digest.
 * @param network - The Bitcoin network for HRP selection.
 * @returns The bech32-encoded P2WPKH address.
 */
function encodeP2WPKH(hash160: Uint8Array, network: BitcoinNetwork): string {
  const hrp = NETWORK_HRP[network];
  const witnessVersion = 0;
  const words = [witnessVersion, ...bech32.toWords(hash160)];
  return bech32.encode(hrp, words);
}

/**
 * Compute hash160 (RIPEMD160 of SHA256) for a compressed public key.
 *
 * @param publicKey - The 33-byte compressed secp256k1 public key.
 * @returns The 20-byte hash160 digest.
 */
function hash160(publicKey: Uint8Array): Uint8Array {
  return ripemd160(sha256(publicKey));
}

/**
 * Native Bitcoin HD keyring.
 *
 * Implements a BIP-39 / BIP-32 / BIP-84 hierarchy producing native SegWit
 * (P2WPKH) bech32 addresses. The keyring is intentionally minimal and only
 * exposes the surface required by `@metamask/keyring-controller`:
 *
 * - {@link serialize} / {@link deserialize}
 * - {@link addAccounts} / {@link getAccounts} / {@link removeAccount}
 * - {@link exportAccount}
 *
 * Bitcoin transaction signing is intentionally out of scope and lives in the
 * higher-level multichain transaction pipeline.
 */
export class BitcoinKeyring {
  static readonly type = 'Bitcoin HD Key Tree';

  readonly type = BitcoinKeyring.type;

  #mnemonic?: string;

  #network: BitcoinNetwork = BitcoinNetwork.Mainnet;

  #accountIndex = 0;

  #addresses: string[] = [];

  constructor(opts: BitcoinKeyringOptions = {}) {
    // Defer derivation until `deserialize` so callers can construct the
    // keyring without immediately performing async crypto work, mirroring the
    // `@metamask/eth-hd-keyring` lifecycle expected by the keyring controller.
    this.#network = opts.network ?? BitcoinNetwork.Mainnet;
  }

  /**
   * Restore the keyring from a previously {@link serialize}-d state.
   *
   * When `state.mnemonic` is omitted, a new BIP-39 mnemonic is generated.
   *
   * @param state - The persisted state.
   */
  async deserialize(state: BitcoinKeyringOptions = {}): Promise<void> {
    this.#network = state.network ?? this.#network;
    this.#accountIndex = state.accountIndex ?? 0;
    this.#mnemonic = state.mnemonic ?? this.#generateMnemonic();
    this.#addresses = [];

    const targetAccounts = state.numberOfAccounts ?? 0;
    if (targetAccounts > 0) {
      await this.addAccounts(targetAccounts);
    }
  }

  #generateMnemonic(): string {
    return new TextDecoder().decode(generateMnemonic(wordlist, 128));
  }

  /**
   * Serialise the keyring into a JSON-compatible object that can later be
   * passed to {@link deserialize}.
   */
  async serialize(): Promise<BitcoinKeyringState> {
    if (!this.#mnemonic) {
      throw new Error('BitcoinKeyring: cannot serialize uninitialised keyring');
    }

    return {
      mnemonic: this.#mnemonic,
      numberOfAccounts: this.#addresses.length,
      network: this.#network,
      accountIndex: this.#accountIndex,
    };
  }

  /**
   * Derive `numberOfAccounts` new addresses starting at the next free index
   * along the configured BIP-84 chain.
   *
   * @param numberOfAccounts - How many new addresses to derive.
   * @returns The list of newly derived addresses.
   */
  async addAccounts(numberOfAccounts = 1): Promise<string[]> {
    if (!this.#mnemonic) {
      this.#mnemonic = this.#generateMnemonic();
    }

    const newAddresses: string[] = [];
    for (let i = 0; i < numberOfAccounts; i++) {
      const index = this.#addresses.length;
      const address = await this.#deriveAddress(index);
      this.#addresses.push(address);
      newAddresses.push(address);
    }
    return newAddresses;
  }

  /**
   * Get the list of derived addresses currently tracked by the keyring.
   */
  async getAccounts(): Promise<string[]> {
    return [...this.#addresses];
  }

  /**
   * Remove a previously derived address from the keyring.
   *
   * Note: removal does not free the BIP-32 index; the address is simply
   * dropped from the tracked list to preserve deterministic re-derivation.
   *
   * @param address - The bech32 address to remove.
   */
  async removeAccount(address: string): Promise<void> {
    const index = this.#addresses.indexOf(address);
    if (index === -1) {
      throw new Error(`BitcoinKeyring: unknown address ${address}`);
    }
    this.#addresses.splice(index, 1);
  }

  /**
   * Export the raw private key (hex) backing the supplied bech32 address.
   *
   * @param address - The bech32 address to look up.
   * @returns The 32-byte private key encoded as a hex string.
   */
  async exportAccount(address: string): Promise<string> {
    const index = this.#addresses.indexOf(address);
    if (index === -1) {
      throw new Error(`BitcoinKeyring: unknown address ${address}`);
    }

    const node = await this.#deriveNode(index);
    if (!node.privateKeyBytes) {
      throw new Error('BitcoinKeyring: derived node is missing a private key');
    }
    return bytesToHex(node.privateKeyBytes);
  }

  /**
   * The Bitcoin network this keyring is configured for.
   */
  get network(): BitcoinNetwork {
    return this.#network;
  }

  async #deriveAddress(index: number): Promise<string> {
    const node = await this.#deriveNode(index);
    if (!node.compressedPublicKeyBytes) {
      throw new Error(
        'BitcoinKeyring: derived node is missing a compressed public key',
      );
    }
    const digest = hash160(node.compressedPublicKeyBytes);
    return encodeP2WPKH(digest, this.#network);
  }

  async #deriveNode(index: number): Promise<SLIP10Node> {
    if (!this.#mnemonic) {
      throw new Error('BitcoinKeyring: cannot derive without a mnemonic');
    }

    const coin = COIN_TYPE[this.#network];
    return SLIP10Node.fromDerivationPath({
      curve: 'secp256k1',
      derivationPath: [
        `bip39:${this.#mnemonic}`,
        `bip32:${PURPOSE}'`,
        `bip32:${coin}'`,
        `bip32:${this.#accountIndex}'`,
        `bip32:0`,
        `bip32:${index}`,
      ],
    });
  }

  /**
   * Compute the HD seed for the configured mnemonic. Exposed for tests.
   */
  async getSeed(): Promise<Uint8Array> {
    if (!this.#mnemonic) {
      throw new Error('BitcoinKeyring: cannot compute seed without a mnemonic');
    }
    return mnemonicToSeed(this.#mnemonic, wordlist);
  }
}

/**
 * Builder produced by {@link bitcoinKeyringBuilder}, compatible with the
 * `keyringBuilders` option accepted by `@metamask/keyring-controller`.
 */
export interface BitcoinKeyringBuilder {
  (): BitcoinKeyring;
  type: typeof BitcoinKeyring.type;
}

/**
 * Construct a keyring builder for the {@link BitcoinKeyring}, suitable for
 * registration with `@metamask/keyring-controller`.
 *
 * @param opts - Default keyring options used when the keyring is first
 * instantiated by the controller.
 */
export function bitcoinKeyringBuilder(
  opts: BitcoinKeyringOptions = {},
): BitcoinKeyringBuilder {
  const builder = (() => new BitcoinKeyring(opts)) as BitcoinKeyringBuilder;
  builder.type = BitcoinKeyring.type;
  return builder;
}
///: END:ONLY_INCLUDE_IF
