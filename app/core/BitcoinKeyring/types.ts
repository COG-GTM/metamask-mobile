/**
 * Supported Bitcoin networks for key derivation and address generation.
 */
export enum BitcoinNetwork {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

/**
 * Serialized state persisted by the KeyringController for this keyring.
 */
export interface BitcoinKeyringState {
  mnemonic?: number[];
  numberOfAccounts: number;
  activeIndices?: number[];
  nextDeriveIndex?: number;
  hdPath: string;
  network: BitcoinNetwork;
}

/**
 * Represents a derived Bitcoin account (keypair + address).
 */
export interface BitcoinKeyringAccount {
  address: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  derivationIndex: number;
}
