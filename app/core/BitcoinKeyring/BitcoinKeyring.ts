import type { RootedSLIP10PathTuple } from '@metamask/key-tree';
import { SLIP10Node } from '@metamask/key-tree';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
// Available via the bitcoin-address-validation dependency and pinned in resolutions.
// eslint-disable-next-line import/no-extraneous-dependencies
import { bech32 } from 'bech32';
import {
  BitcoinNetwork,
  type BitcoinKeyringState,
  type BitcoinKeyringAccount,
} from './types';

const BIP84_PURPOSE = 84;
const BITCOIN_MAINNET_COIN_TYPE = 0;
const BITCOIN_TESTNET_COIN_TYPE = 1;

const BECH32_HRP: Record<BitcoinNetwork, string> = {
  [BitcoinNetwork.Mainnet]: 'bc',
  [BitcoinNetwork.Testnet]: 'tb',
};

/**
 * Returns the default BIP-84 derivation path for a given network.
 *
 * @param network - The Bitcoin network.
 * @returns The BIP-84 base path (e.g. "m/84'/0'/0'").
 */
function defaultHdPath(network: BitcoinNetwork): string {
  const coinType =
    network === BitcoinNetwork.Mainnet
      ? BITCOIN_MAINNET_COIN_TYPE
      : BITCOIN_TESTNET_COIN_TYPE;
  return `m/${BIP84_PURPOSE}'/${coinType}'/0'`;
}

/**
 * Derives a P2WPKH (Bech32) address from a compressed public key.
 *
 * @param publicKey - 33-byte compressed SEC1 public key.
 * @param network - Target Bitcoin network.
 * @returns The Bech32-encoded native SegWit address.
 */
function publicKeyToP2wpkhAddress(
  publicKey: Uint8Array,
  network: BitcoinNetwork,
): string {
  const pubkeyHash = ripemd160(sha256(publicKey));
  const words = bech32.toWords(pubkeyHash);
  // Witness version 0
  words.unshift(0);
  return bech32.encode(BECH32_HRP[network], words);
}

/**
 * Native Bitcoin HD keyring using BIP-84 derivation for P2WPKH addresses.
 *
 * Implements the keyring interface expected by `@metamask/keyring-controller`.
 * Transaction and message signing are not yet implemented; calling those
 * methods will throw.
 */
export class BitcoinKeyring {
  static readonly type = 'Bitcoin HD Key Tree';

  readonly type = BitcoinKeyring.type;

  #mnemonic: Uint8Array | undefined;

  #hdPath: string;

  #network: BitcoinNetwork;

  #accounts: BitcoinKeyringAccount[] = [];

  #nextDeriveIndex = 0;

  constructor() {
    this.#hdPath = defaultHdPath(BitcoinNetwork.Mainnet);
    this.#network = BitcoinNetwork.Mainnet;
  }

  /**
   * Serializes the keyring state for persistence.
   *
   * @returns The serializable keyring state.
   */
  async serialize(): Promise<BitcoinKeyringState> {
    return {
      mnemonic: this.#mnemonic ? Array.from(this.#mnemonic) : undefined,
      numberOfAccounts: this.#accounts.length,
      nextDeriveIndex: this.#nextDeriveIndex,
      hdPath: this.#hdPath,
      network: this.#network,
    };
  }

  /**
   * Restores the keyring from persisted state and re-derives accounts.
   *
   * @param state - Previously serialized keyring state.
   */
  async deserialize(state?: BitcoinKeyringState): Promise<void> {
    if (!state) {
      return;
    }
    if (state.mnemonic) {
      this.#mnemonic = new Uint8Array(state.mnemonic);
    }
    if (state.hdPath) {
      this.#hdPath = state.hdPath;
    }
    if (state.network) {
      this.#network = state.network;
    }

    this.#accounts = [];
    this.#nextDeriveIndex = state.nextDeriveIndex ?? state.numberOfAccounts;
    if (state.numberOfAccounts > 0 && this.#mnemonic) {
      await this.#deriveAccounts(state.numberOfAccounts);
    }
  }

  /**
   * Generates `n` new accounts and returns their addresses.
   *
   * @param n - Number of accounts to add (defaults to 1).
   * @returns The addresses of the newly created accounts.
   */
  async addAccounts(n = 1): Promise<string[]> {
    if (!this.#mnemonic) {
      throw new Error('BitcoinKeyring: mnemonic not set');
    }
    const startIndex = this.#nextDeriveIndex;
    const prevLength = this.#accounts.length;
    await this.#deriveAccounts(n, startIndex);
    this.#nextDeriveIndex = startIndex + n;
    return this.#accounts.slice(prevLength).map((a) => a.address);
  }

  /**
   * Returns all account addresses managed by this keyring.
   *
   * @returns Array of Bech32 addresses.
   */
  async getAccounts(): Promise<string[]> {
    return this.#accounts.map((a) => a.address);
  }

  /**
   * Exports the private key for the given address as a hex string.
   *
   * @param address - The Bech32 address to export.
   * @returns The hex-encoded private key.
   */
  async exportAccount(address: string): Promise<string> {
    const account = this.#findAccount(address);
    return Buffer.from(account.privateKey).toString('hex');
  }

  /**
   * Removes the account with the specified address from the keyring.
   *
   * @param address - The address to remove.
   */
  removeAccount(address: string): void {
    const idx = this.#accounts.findIndex(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (idx === -1) {
      throw new Error(
        `BitcoinKeyring: account not found for address "${address}"`,
      );
    }
    this.#accounts.splice(idx, 1);
  }

  // ---- Signing stubs (to be implemented) ------------------------------------

  async signTransaction(
    _address: string,
    _transaction: unknown,
  ): Promise<unknown> {
    throw new Error('BitcoinKeyring: signTransaction is not yet implemented');
  }

  async signMessage(_address: string, _data: string): Promise<string> {
    throw new Error('BitcoinKeyring: signMessage is not yet implemented');
  }

  async signPersonalMessage(_address: string, _data: string): Promise<string> {
    throw new Error(
      'BitcoinKeyring: signPersonalMessage is not yet implemented',
    );
  }

  // ---- Private helpers ------------------------------------------------------

  #findAccount(address: string): BitcoinKeyringAccount {
    const account = this.#accounts.find(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (!account) {
      throw new Error(
        `BitcoinKeyring: account not found for address "${address}"`,
      );
    }
    return account;
  }

  /**
   * Derive `count` accounts starting from `startIndex` using BIP-84.
   *
   * Path pattern: {hdPath}/0/{index}
   * e.g. m/84'/0'/0'/0/0, m/84'/0'/0'/0/1, ...
   */
  async #deriveAccounts(count: number, startIndex = 0): Promise<void> {
    if (!this.#mnemonic) {
      throw new Error('BitcoinKeyring: mnemonic not set');
    }

    const pathParts = this.#hdPath
      .replace('m/', '')
      .split('/')
      .map((part) => {
        const hardened = part.endsWith("'");
        const index = parseInt(part.replace("'", ''), 10);
        return hardened ? `bip32:${index}'` : `bip32:${index}`;
      });

    const mnemonic = Buffer.from(this.#mnemonic).toString('utf8');

    for (let i = startIndex; i < startIndex + count; i++) {
      const derivationPath = [
        `bip39:${mnemonic}`,
        ...pathParts,
        'bip32:0',
        `bip32:${i}`,
      ] as unknown as RootedSLIP10PathTuple;

      const node = await SLIP10Node.fromDerivationPath({
        derivationPath,
        curve: 'secp256k1',
      });

      if (!node.compressedPublicKeyBytes) {
        throw new Error(
          `BitcoinKeyring: failed to derive public key for index ${i}`,
        );
      }
      if (!node.privateKeyBytes) {
        throw new Error(
          `BitcoinKeyring: failed to derive private key for index ${i}`,
        );
      }

      const address = publicKeyToP2wpkhAddress(
        node.compressedPublicKeyBytes,
        this.#network,
      );

      this.#accounts.push({
        address,
        publicKey: node.compressedPublicKeyBytes,
        privateKey: node.privateKeyBytes,
      });
    }
  }
}
